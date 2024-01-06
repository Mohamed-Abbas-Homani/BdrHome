import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './Components/Home';
import Products from './Components/Products';
import Stats from './Components/Stats';
import BarcodeScanner from './Components/BarcodeScanner';

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={Home} options={{headerTitleStyle:{fontSize:18, color:'#128912'}}}/>
      <Stack.Screen name="Stats" component={Stats} options={{headerTitleStyle:{fontSize:18, color:'#128912'}}}/>
      <Stack.Screen name="Products" component={Products} options={{headerTitleStyle:{fontSize:18, color:'#128912'}}}/>
      <Stack.Screen name="BarcodeScanner" component={BarcodeScanner} options={{headerTitleStyle:{fontSize:18, color:'#128912'}}}/>
    </Stack.Navigator>
  </NavigationContainer>
  );
}