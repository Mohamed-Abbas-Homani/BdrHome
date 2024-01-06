import {
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { 
  deleteRecord,
} from '../db';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles';

const Record = ({ id, name, count, body, price, debt, date, fetchData, setInputs, setEditMode, state }) => {
  return (
    <View style={styles.record}>
      <View style={{ width: '70%' }}>
        {state !== 'notes' && <Text style={{ color: '#aaffa9', fontSize: 16 }}>
          {state === "debts" ? <Ionicons name="person" size={16} color="#aaffa9" /> :
            <MaterialCommunityIcons name="tag" size={16} color="#aaffa9" />
          } {name}</Text>}
        {state !== 'debts' && state !== 'notes' && <Text style={{ color: '#ffaaaa', fontSize: 16 }}>
          <MaterialCommunityIcons name="counter" size={16} color="#faa" /> {count} </Text>}
        {state === 'sells' && <Text style={{ color: '#ffff99', fontSize: 16 }}><MaterialIcons name="attach-money" size={16} color="#ffff99" />{price}</Text>}
        {state === 'debts' && <Text style={{ color: '#ffaaaa' }}><MaterialIcons name="attach-money" size={16} color="#ffff99" /> {debt}</Text>}
        {state === 'notes' && <Text style={{ color: '#e9e9e9', fontWeight: 'bold' }}> {body} </Text>}
      </View>
      <View style={{ width: '20%' }}>
        {state !== "sells" && <TouchableOpacity
          onPress={() => {
            setEditMode(true);
            setInputs(
              {
                id,
                name,
                count: String(count),
                price: String(price),
                debt: String(debt),
                date,
                body,
              }
            );
          }}
        >
          <Text style={styles.editBtn}
          >
            <MaterialIcons name="edit" size={18} color="#456789" />
          </Text>
        </TouchableOpacity>}
        <TouchableOpacity
          onPress={() => {
            deleteRecord(id, state);
            fetchData(state);
          }}
        >
          <Text style={styles.deleteBtn}
          >
            <MaterialIcons name="delete" size={18} color="#456789" />
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Record;
