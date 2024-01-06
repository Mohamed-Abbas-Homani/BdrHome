import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import db, { currentDate, insertProduct, getProductSize } from '../db';
import Product from './Product';
import styles from '../styles';
import { Audio } from 'expo-av';

const Products = ({ navigation, route }) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(false);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [sbbc, setSbbc] = useState(false);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState({
    snt: 'SELECT * FROM products ORDER BY date DESC LIMIT 20;',
    params: [],
  });
  const [inputs, setInputs] = useState({
    id: '',
    name: '',
    categorie: '',
    count: '',
    price: '',
    barcode: '',
    date: '',
  });
  
  const reset = () => {
    setInputs({
      id: '',
      name: '',
      categorie: '',
      count: '',
      price: '',
      barcode: '',
      date: '',
    });
  };

  const valid = () =>
  (
    inputs.name !== '' &&
    inputs.categorie !== '' &&
    inputs.count !== '' &&
    inputs.price !== ''
  );

  const fetchData = useCallback(async () => {
    db.transaction((tx) => {
      tx.executeSql(
        query.snt,
        query.params,
        (_, { rows }) => {
          const data = rows._array;
          setList(data);
          if(sbbc)
          {
            if(route.params?.barcodeData)
              {
                route.params.barcodeData = ""
              }
          }
          setSbbc(false)
          
        }
      );
    });
  }, [query]);

  
  useEffect(() => {
    if(!sbbc)setInputs({...inputs, barcode: route.params?.barcodeData})
    
    if(sbbc){
      setQuery({
        snt:
          "SELECT * FROM products WHERE barcode = ?",
        params: [route.params?.barcodeData],
      });
    }
  }, [route.params?.barcodeData]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })()
  }, [query]);

  useEffect(() => {
    getProductSize().then(setTotal)
  }, [list])

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/saveproduct.mp3')
    );
    await sound.playAsync();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.productSearch}>
          <TextInput
            value={search}
            onChangeText={(text) => setSearch(text)}
            placeholder='Search by name or category'
            maxLength={40}
          />
          <View style={{justifyContent:'space-evenly', flexDirection:'row'}}>
          <TouchableOpacity
            onPress={() => {
              if (search)
                setQuery({
                  snt:
                    "SELECT * FROM products WHERE name LIKE '%' || ? || '%' OR categorie LIKE '%' || ? || '%';",
                  params: [search, search],
                });
              else {
                setQuery({
                  snt: 'SELECT * FROM products ORDER BY date DESC LIMIT 20;',
                  params: [],
                });
              }
            }}
            style={{ padding: 10, backgroundColor: '#128912', borderRadius: 10, marginRight:5 }}
          >
            <Ionicons name='md-search' size={20} color='#e9e9e9' />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10, backgroundColor: '#128912', borderRadius: 10 }}
            onPress={() => {
              navigation.navigate('BarcodeScanner', {page: 'Products'})
              setSbbc(true)
            }}
          >
            <Text style={{color:'#e9e9e9'}}>
              Scan
            </Text>
          </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: '72%', padding: 10 }}>
          <ScrollView>
            {!list.length && <Text>Add New Products</Text>}
            {list.map((product) => (
              <Product
                key={product.id}
                {...product}
                setForm={setForm}
                setEditMode={setEditMode}
                setInputs={setInputs}
                inputs={inputs}
                fetchData={fetchData}
              />
            ))}
          </ScrollView>
          
        </View>
        {form && (
          <View style={styles.formProduct}>
            <TextInput
              value={inputs.name}
              onChangeText={(text) => setInputs({ ...inputs, name: text })}
              placeholder='Product Name'
              style={styles.productInput}
            />
            <TextInput
              value={inputs.categorie}
              onChangeText={(text) => setInputs({ ...inputs, categorie: text })}
              placeholder='Category'
              style={styles.productInput}
            />
            <TextInput
              value={inputs.count}
              onChangeText={(text) => setInputs({ ...inputs, count: text })}
              placeholder='Count'
              style={styles.productInput}
              keyboardType='numeric'
            />
            <TextInput
              value={inputs.price}
              onChangeText={(text) => setInputs({ ...inputs, price: text })}
              placeholder='Price'
              style={styles.productInput}
              keyboardType='numeric'
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('BarcodeScanner',{page: 'Products'})}
              style={{ padding: 10, backgroundColor: '#128912', borderRadius: 10 }}
            >
              <Text style={{ color: '#e9e9e9', textAlign:'center' }}>{`Scan Barcode ${inputs.barcode?"\n"+inputs.barcode:""}`}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.backBar}>
          <TouchableOpacity
            onPress={() => {
              if (form) {
                setEditMode(false);
                setForm(!form);
                reset();
              } else {
                navigation.goBack();
              }
            }}
            style={{ margin: 5 }}
          >
            <Text style={styles.chgDisplayBtn}>
              {form ? 'Cancel': (
                <MaterialIcons name='home' size={24} color='#e9e9e9' />
              )}
            </Text>
          </TouchableOpacity>
          { !form && <Text
            style={styles.chgDisplayBtn}
            >
              {total} Products
            </Text>}
          <TouchableOpacity
            onPress={() => {
              if (!form) setForm(true);
              if (form && valid()) {
                setForm(false);
                reset();
                insertProduct(
                  inputs.id,
                  inputs.name.trim(),
                  inputs.barcode || "None",                  
                  inputs.categorie.trim(),
                  Number(inputs.count.trim()),
                  Number(inputs.price.trim()),
                  currentDate,
                  editMode
                );
                playSound();
                if(route.params?.barcodeData)
                {
                  route.params.barcodeData = ""
                }
                fetchData();
              }
            }}
            style={{ margin: 5 }}
          >
            <Text style={styles.chgDisplayBtn}>
              <MaterialIcons name={form ? 'save' : 'add'} size={24} color='#e9e9e9' />
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Products;
