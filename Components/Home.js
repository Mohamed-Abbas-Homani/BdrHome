import {
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView
} from 'react-native';
import db, {
  insertSell,
  insertDebt,
  insertNeed,
  insertNotes,
  initDataBase,
  getPriceByName,
  updateProductCount,
  currentDate,
  generateInsertStatements,
  executeInsertStatements,
  getNameByBarcode
} from '../db';
import { useCallback, useEffect, useState } from 'react';
import {
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import styles from '../styles';
import * as Clipboard from 'expo-clipboard';
import Record from './Record';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

let dollar;
(async () => {try {
  const value = await AsyncStorage.getItem('dollar');
  if (value !== null) {
    dollar = value
  }
} catch (error) {
  console.error('Error retrieving data:', error);
}})()

const Logo = () => {
  const [chDollar, setChDollar] = useState({state:false, value: ''})
  useEffect(() => {
    (async () => {try {
      const value = await AsyncStorage.getItem('dollar');
      if (value !== null) {
        setChDollar({...chDollar, value: value})
        
      }
    } catch (error) {
      console.error('Error retrieving data:', error);
    }})()
  }, [])

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/transfer.mp3')
    );
    await sound.playAsync();
  };

  return (
    <View style={styles.logoContainer}>
      <TouchableOpacity
        onLongPress={() => {
          generateInsertStatements().then((exports) =>
            Clipboard.setStringAsync(exports)
          );
          playSound()
        }}
      >
        <Image
          source={require('../assets/logo.jpg')}
          style={{
            width: 120,
            height: 70,
            resizeMode: 'contain'
          }}
        />
      </TouchableOpacity>
      <TouchableOpacity style={{position:'absolute',top: 4, left: 4, padding:5, flexDirection:'row'}}
      onPress={async () =>{
        if(chDollar.state) {
          setChDollar({...chDollar,state:false})
          try {
            await AsyncStorage.setItem('dollar', chDollar.value);
            dollar =  chDollar.value
          } catch (error) {
            console.error('Error saving data:', error);
          }
        }
        else {
          setChDollar({...chDollar, state:true})
        }
      }}
      >
        <MaterialIcons name={chDollar.state? "save":"attach-money"} size={26} color="#126624" />
        {
          chDollar.state && 
          <TextInput
            style={{marginLeft:5, color:"#126624"}}
            value={chDollar.value}
            placeholder='$ in L.L'
            onChangeText={text => setChDollar({...chDollar, value:text})}
            keyboardType='numeric'
          />
        }
      </TouchableOpacity>
    </View>
  );
};

const Home = ({ route, navigation }) => {
  const [state, setState] = useState('sells');
  const [editMode, setEditMode] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [records, setRecords] = useState([]);
  const [current, setCurrent] = useState([]);
  const [importing, setImporting] = useState(false);
  const [inputs, setInputs] = useState({
    id: '',
    name: '',
    count: '',
    price: '',
    debt: '',
    body: ''
  });

  const resetInputs = () => {
    setInputs({
      id: '',
      name: '',
      count: '',
      price: '',
      debt: '',
      body: ''
    });
  };

  useEffect(() => {
    initDataBase();
    fetchData('sells');
  }, []);

  useEffect(() => {
    const fetchProductName = async () => {
      const barcodeData = route.params?.barcodeData;
      if (barcodeData) {
        try {
          const productName = await getNameByBarcode(barcodeData);
          setInputs({ ...inputs, name: productName });
          if (route.params?.barcodeData) {
            route.params.barcodeData = '';
          }
        } catch (error) {
          console.error('Error fetching product name:', error);
        }
      }
    };

    fetchProductName();
  }, [route.params?.barcodeData]);

  useEffect(() => {
    if (state === 'sells') {
      let tmp = 0;
      records.map((sell) => {
        tmp += sell.price * sell.count;
      });
      setTotal(tmp);
    }
  }, [records]);

  useEffect(() => {
    fetchData(state);
  }, [state]);

  useEffect(() => {
    let ctotal = 0;
    current.map((c) => {
      if (c.ok) ctotal += c.price * c.count;
    });
    setCurrentTotal(ctotal);
  }, [current]);

  const fetchData = useCallback(async (table) => {
    let query = 'SELECT * FROM sells WHERE date = ?;';
    db.transaction((tx) => {
      if (table !== 'sells') query = `SELECT * FROM ${table};`;
      tx.executeSql(
        query,
        state === 'sells' ? [currentDate] : [],
        (_, { rows }) => {
          const data = rows._array;
          setRecords(data);
        }
      );
    });
  }, [state]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Logo />
        <View style={styles.displayContainer}>
          <View style={styles.chgDisplayBtns}>
            <TouchableOpacity onPress={() => setState('sells')}>
              <Text style={styles.chgDisplayBtn}>Sells</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setState('needs')}>
              <Text style={styles.chgDisplayBtn}>Needs</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setState('debts')}>
              <Text style={styles.chgDisplayBtn}>Debts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setState('notes')}>
              <Text style={styles.chgDisplayBtn}>Notes</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputsContainer}>
            {state !== 'notes' && (
              <TextInput
                style={styles.productInput}
                value={inputs.name}
                placeholder="Name"
                onChangeText={(text) => setInputs({ ...inputs, name: text })}
              />
            )}
            {state !== 'debts' && state !== 'notes' && (
              <TextInput
                style={styles.productInput}
                value={inputs.count}
                placeholder="Count"
                onChangeText={(text) => setInputs({ ...inputs, count: text })}
                keyboardType="numeric"
              />
            )}
            {!inputs.name && state === 'sells' && (
              <TouchableOpacity
                style={styles.bcBtn}
                onPress={() => {
                  navigation.navigate('BarcodeScanner', { page: 'Home' });
                }}
              >
                <Text style={{ color: '#666' }}>Barcode</Text>
              </TouchableOpacity>
            )}
            {inputs.name && inputs.count && state === 'sells' && (
              <TouchableOpacity
                onPress={async () => {
                  const [price, ok] = await getPriceByName(
                    inputs.name.trim(),
                    inputs.count.trim()
                  );
                  setCurrent((last) => [
                    ...last,
                    { name: inputs.name.trim(), count: inputs.count.trim(), price: price, ok: ok }
                  ]);
                    resetInputs();
                }}
                style={{
                  padding: 5,
                  backgroundColor: '#d9d9d9',
                  borderRadius: 5
                }}
              >
                <Text style={{ color: '#aa3477' }}>Add</Text>
              </TouchableOpacity>
            )}
            {state === 'debts' && (
              <TextInput
                style={styles.productInput}
                value={inputs.debt}
                placeholder="Debt"
                onChangeText={(text) => setInputs({ ...inputs, debt: text })}
                keyboardType="numeric"
              />
            )}
            {state === 'notes' && (
              <TextInput
                style={styles.productInput}
                value={inputs.body}
                placeholder={importing ? 'Paste your text to load data' : 'write your note...'}
                onChangeText={(text) => setInputs({ ...inputs, body: text })}
                maxLength={1000000}
              />
            )}
          </View>

          <View style={styles.listRecords}>
            <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
              { !!current.length && state === 'sells' && (
                <View style={styles.check}>
                  <View style={styles.table2}>
                  <View style={styles.row}>
                      <Text style={styles.cell2}></Text>
                      <Text style={styles.cell2}>فاتورة</Text>
                      <Text style={styles.cell2}></Text>
                    </View>
                    {current.map(({ name, count, price, ok }, key) => (
                      <View style={styles.row} key={key}>
                        <Text style={styles.cell2}>{name}</Text>
                        <Text style={styles.cell2}>{count}</Text>
                        <Text style={styles.cell2}>
                          {price} {ok && '$'}
                        </Text>
                      </View>
                    ))}
                    {!!current.length && <View style={styles.row}>
                      <Text style={styles.cell2}></Text>
                      <Text style={styles.cell2}></Text>
                      <Text style={styles.cell2}>{currentTotal} $</Text>
                    </View>}
                    {!!current.length &&  <View style={styles.row}>
                      <Text style={styles.cell2}></Text>
                      <Text style={styles.cell2}></Text>
                      <Text style={styles.cell2}>{currentTotal* Number(dollar) } L.L</Text>
                    </View>}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrent([]);
                      setCurrentTotal([]);
                      setInputs([]);
                    }}
                    style={{
                      padding: 5,
                      backgroundColor: '#e9e9e9',
                      borderRadius: 5
                    }}
                  >
                    <Text style={{ color: '#aa3477' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {records.map((record, key) => (
                <Record
                  key={key}
                  {...record}
                  fetchData={fetchData}
                  setInputs={setInputs}
                  setEditMode={setEditMode}
                  state={state}
                />
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity
            onLongPress={() => {
              if (importing) {
                executeInsertStatements(inputs.body);
                setState('sells');
                resetInputs();
                setImporting(false);
              } else {
                setImporting(true);
                setState('notes');
              }
            }}
            onPress={() => {
              if (state === 'sells') {
                let added = [];
                current.map(({ name, count, price, ok }) => {
                  if (ok) {
                    if (!added.includes(name)) {
                      added.push(name);
                      updateProductCount(name, count);
                      insertSell(name || 'name', Number(count) || 0, Number(price) || 0, currentDate);
                      setCurrent([]);
                      setCurrentTotal([]);
                    }
                  }
                });
              } else if (state === 'needs') insertNeed(inputs.id, inputs.name || 'name', Number(inputs.count) || 0, currentDate, editMode);
              else if (state === 'debts') insertDebt(inputs.id, inputs.name || 'name', Number(inputs.debt) || 0, currentDate, editMode);
              else if (state === 'notes') insertNotes(inputs.id, inputs.body || 'note', currentDate, editMode);

              fetchData(state);
              resetInputs();
              setEditMode(false);
            }}
            style={styles.saveBtn}
          >
            <Text style={{ color: '#e9e9e9', fontWeight: 'bold' }}>
              <MaterialIcons name={editMode ? 'save' : 'add'} size={24} color="#e9e9e9" />
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoContainer}>
          <TouchableOpacity onPress={() => navigation.push('Stats')} style={styles.stats}>
            <Text style={{ color: '#e9e9e9', fontWeight: 'bold' }}>
              Stats <Ionicons name="stats-chart" size={18} color="#e9e9e9" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
          onPress={() => navigation.push('Products')} style={styles.stats}
          onLongPress={() => {
            generateInsertStatements(false).then((exports) =>
              Clipboard.setStringAsync(exports)
            );
          }}
          >
            <Text style={{ color: '#e9e9e9', fontWeight: 'bold' }}>
              Products <MaterialCommunityIcons name="tag" size={18} color="#e9e9e9" />
            </Text>
          </TouchableOpacity>
          <View style={styles.stats}>
            <Text style={{ color: '#e9e9e9', fontWeight: 'bold' }}>Total {total.toFixed(2)} $</Text>
          </View>
        </View>
        <StatusBar style="auto" />
      </View>
    </KeyboardAvoidingView>
  );
};

export default Home;
