// App entry: the language is chosen before any screen module loads, so text built at module level
// (labels, menus) is already translated. Imports run in order, so expo-router starts afterwards.
import './src/i18n/init';
import 'expo-router/entry';
