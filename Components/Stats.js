import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import db, { currentDate } from '../db';
import styles from '../styles';

// TableGenerator component
const TableGenerator = ({ type, list, total }) => {
  return (
    <>
      <View style={styles.row}>
        <Text style={styles.cell}>{type === 'debts' ? 'Name' : 'Product'}</Text>
        {type === 'products' && <Text style={styles.cell}>categorie</Text>}
        {type !== 'debts' && <Text style={styles.cell}>Count</Text>}
        {['sells', 'products'].includes(type) && <Text style={styles.cell}>Price</Text>}
        {type === 'debts' && <Text style={styles.cell}>Debt</Text>}
        {type === 'products' && <Text style={styles.cell}>barcode</Text>}
        {!['needs', 'products'].includes(type) && <Text style={styles.cell}>Date</Text>}
      </View>
      {list.map(({ name, count, price, date, debt, categorie, barcode }, key) => (
        <View style={styles.row} key={key}>
          <Text style={styles.cell}>{name}</Text>
          {type === 'products' && <Text style={styles.cell}>{categorie}</Text>}
          {type !== 'debts' &&  <Text style={styles.cell}>{count}</Text>}
          {['sells', 'products'].includes(type)  && <Text style={styles.cell}>{price}</Text>}
          {type === 'debts' && <Text style={styles.cell}>{debt}</Text>}
          {type === 'products' && <Text style={styles.cell}>{barcode}</Text>}
          {type !== 'needs' && type !== 'products' && <Text style={styles.cell}>{date}</Text>}
        </View>
      ))}
      {['sells', 'products'].includes(type)  && (
        <View style={styles.row}>
          <Text style={styles.cell}>Total Sells</Text>
          <Text style={styles.cell}>{Number(total).toFixed(2)}</Text>
          <Text style={styles.cell}>Profit --18%--</Text>
          <Text style={styles.cell}>{Number(total * 0.18).toFixed(2)}</Text>
        </View>
      )}
    </>
  );
};

// Stats component
const Stats = () => {
  const [list, setList] = useState([]);
  const [type, setType] = useState('');
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState({
    before: currentDate,
    after: currentDate,
  });

  const fetchData = useCallback(async (table) => {
    let query = 'SELECT * FROM sells WHERE date BETWEEN ? AND ?';
    db.transaction((tx) => {
      if (table !== 'sells') query = `SELECT * FROM ${table};`;
      tx.executeSql(
        query,
        type === 'sells' ? [date.before, date.after] : [],
        (_, { rows }) => {
          const data = rows._array;
          setList(data);
          getTotal(data);
        }
      );
    });
  }, [type, date]);

  const getTotal = (data) => {
    if (['sells', 'products'].includes(type) ) {
      let tmp = 0;
      data.map(({ count, price }) => {
        tmp += price * count;
      });
      setTotal(tmp);
    }
  };

  useEffect(() => {
    if (type) fetchData(type);
  }, [type, date]);

  return (
    <>
      <View style={{ flexDirection: 'row', margin: 15, justifyContent: 'space-evenly' }}>
        <TouchableOpacity onPress={() => setType('sells')} >
          <Text style={styles.chgDisplayBtn}>Sells</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setType('needs')} >
          <Text style={styles.chgDisplayBtn}>Needs</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setType('debts')} >
          <Text style={styles.chgDisplayBtn}>Debts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setType('products')} >
          <Text style={styles.chgDisplayBtn}>Products</Text>
        </TouchableOpacity>
      </View>
      {type === 'sells' && (
        <View style={{ flexDirection: 'row', margin: 15, justifyContent: 'space-evenly', alignItems:'center' }}>
            <Text>من</Text>
          
          <TextInput
            style={{ padding:10, color:'#129812', fontWeight:'bold', borderBottomWidth:1 }}
            value={date.before}
            onChangeText={(text) => setDate({ ...date, before: text })}
            placeholder='from...'
            keyboardType='numeric'
          />
          <Text>الى</Text>
          <TextInput
            style={{ padding:10, color:'#129812', fontWeight:'bold', borderBottomWidth:1 }}
            value={date.after}
            onChangeText={(text) => setDate({ ...date, after: text })}
            placeholder='to...'
            keyboardType='numeric'
          />
        </View>
      )}
      { list.length > 0 && <View style={styles.table}>
        <ScrollView>
          <TableGenerator type={type} list={list} total={total} />
        </ScrollView>
      </View>}
    </>
  );
};

// Export the Stats component
export default Stats;
