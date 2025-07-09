import { TextInput } from 'react-native';
import SafeKeyboardView from './SafeKeyboardView';
import GradientButton from './GradientButton';
import getStyles from '../styles';
import { useTheme } from '../contexts/ThemeContext';

export interface AuthFormProps {
  email: string;
  onEmailChange: (text: string) => void;
  password: string;
  onPasswordChange: (text: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  children?: React.ReactNode;
}

export default function AuthForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  submitLabel,
  children,
}: AuthFormProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <SafeKeyboardView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.textSecondary}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor={theme.textSecondary}
      />
      <GradientButton text={submitLabel} onPress={onSubmit} />
      {children}
    </SafeKeyboardView>
  );
}

