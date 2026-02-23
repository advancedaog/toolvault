import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { login } from '../store/authStore';
import { User } from '../types';

interface Props {
    onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: Props) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleLogin = () => {
        setError('');
        if (!name.trim() || !password.trim()) {
            setError('Please enter both name and password.');
            return;
        }
        const user = login(name.trim(), password);
        if (user) {
            onLogin(user);
        } else {
            setError('Invalid credentials. Try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
                {/* Logo / Branding */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoEmoji}>📦</Text>
                    </View>
                    <Text style={styles.title}>Inventory Tracker</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </View>

                {/* Form Card */}
                <View style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry
                        />
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                {/* Help text */}
                <Text style={styles.helpText}>
                    Demo: admin / admin123 (Admin) • user / user123 (User)
                </Text>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoIcon: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    logoEmoji: {
        fontSize: 36,
    },
    title: {
        ...typography.h1,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: colors.bgInput,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        color: colors.textPrimary,
        ...typography.body,
        borderWidth: 1,
        borderColor: colors.border,
    },
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.error,
    },
    errorText: {
        ...typography.caption,
        color: colors.errorLight,
        textAlign: 'center',
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
        ...shadows.button,
    },
    buttonText: {
        ...typography.bodyBold,
        color: colors.white,
    },
    helpText: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});
