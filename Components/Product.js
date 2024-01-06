import React, { useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { deleteRecord, updateProductCount2 } from '../db';
import styles from '../styles';



const Product = ({id, name, count, categorie,barcode, price, date, setInputs, setEditMode, setForm, fetchData, inputs}) => {
    const [editingCount, setEditingCount] = useState(false)
    const [ecount, setCount] = useState(count)
    return (
      <View style={styles.record}>
        { !editingCount &&
        <>
          <View style={{width:'70%'}}>
          <Text style={{color: '#aaffa9',fontSize:14}}>
            <MaterialCommunityIcons name="tag" size={14} color="#aaffa9" /> {name}
          </Text>
          <Text style={{color: '#e9e9e9',fontWeight: 'bold'}}>
            <MaterialIcons name="category" size={14} color="#c9c9c9" /> {categorie}
          </Text>
          <Text style={{color: '#ffaaaa',fontSize:14}}>
            <MaterialCommunityIcons name="counter" size={14} color="#faa" /> {count}
          </Text>
          <Text style={{color: '#ffff99',fontSize:14}}>
            <MaterialIcons name="attach-money" size={14} color="#ffff99" />{price}
          </Text>
        </View>
        <View style={{width:'20%'}}>
        <TouchableOpacity 
                  onPress={() => {
                    setEditingCount(true)
                  }}
                  onLongPress={() => {
                    setEditMode(true);
                    setForm(true)
                    setInputs(
                      { 
                        id,
                        name,
                        count:String(count),
                        price:String(price),
                        categorie,
                        barcode,
                        date,
                      }
                    );
                  }}
        >
          <Text style={styles.editBtn}

          >
            <MaterialIcons name="edit" size={18} color="#456789" />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
                 onPress={() => {
                  deleteRecord(id, 'products');
                  fetchData();
                }}
        >
          <Text style={styles.deleteBtn}
 
          >
            <MaterialIcons name="delete" size={18} color="#456789" />
          </Text>
        </TouchableOpacity>  
        </View>
        </>
        }
        {
          editingCount && 
          <View style={{
            flexDirection:'row',
            justifyContent:'space-around'
          }}>
            <TouchableOpacity style={styles.ctrlBtn}
              onPress={() => {
                setCount(ecount + 1)
              }}
            >
              <Text style={{fontSize:24, color:'#56789a'}}>
                +
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn}
              onPress={() => {
                setEditingCount(false)
                updateProductCount2(id, ecount)
                fetchData()
              }}
              >
              <Text style={{fontSize:24, color:'#56789a'}}>
                {ecount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn}
              onPress={() => {
                setCount(ecount === 0? 0:ecount - 1)
              }}
            >
              <Text style={{fontSize:24, color:'#56789a'}}>
                --
              </Text>
            </TouchableOpacity>
          </View>
        }
      </View>
    );
  }

  export default Product