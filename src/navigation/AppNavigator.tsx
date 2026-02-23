import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { User } from '../types';
import { logout } from '../store/authStore';
import ScanScreen from '../screens/ScanScreen';
import AdminScreen from '../screens/AdminScreen';
import AddItemScreen from '../screens/AddItemScreen';
import AddCertificateScreen from '../screens/AddCertificateScreen';
import InventoryListScreen from '../screens/InventoryListScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';

const Tab = createBottomTabNavigator();

interface Props {
    user: User;
    onLogout: () => void;
}

// Wrapper for admin stack (simple state-based navigation within the tab)
type AdminNav =
    | { screen: 'home' }
    | { screen: 'addItem' }
    | { screen: 'addCert'; preselectedItemId?: string }
    | { screen: 'inventory' }
    | { screen: 'itemDetail'; itemId: string };

function AdminTabScreen() {
    const [nav, setNav] = useState<AdminNav>({ screen: 'home' });

    if (nav.screen === 'addItem') {
        return <AddItemScreen onBack={() => setNav({ screen: 'home' })} />;
    }
    if (nav.screen === 'addCert') {
        return <AddCertificateScreen onBack={() => setNav({ screen: 'home' })} />;
    }
    if (nav.screen === 'inventory') {
        return (
            <InventoryListScreen
                onBack={() => setNav({ screen: 'home' })}
                onSelectItem={(itemId) => setNav({ screen: 'itemDetail', itemId })}
            />
        );
    }
    if (nav.screen === 'itemDetail') {
        return (
            <ItemDetailScreen
                itemId={nav.itemId}
                onBack={() => setNav({ screen: 'inventory' })}
                onAddCertificate={() => setNav({ screen: 'addCert' })}
            />
        );
    }
    return (
        <AdminScreen
            onAddItem={() => setNav({ screen: 'addItem' })}
            onAddCertificate={() => setNav({ screen: 'addCert' })}
            onViewInventory={() => setNav({ screen: 'inventory' })}
        />
    );
}

export default function AppNavigator({ user, onLogout }: Props) {
    const handleLogout = () => {
        logout();
        onLogout();
    };

    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    tabBarStyle: {
                        backgroundColor: colors.bgCard,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
                        height: 80,
                        paddingBottom: 20,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: colors.primaryLight,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarLabelStyle: { ...typography.small },
                    headerStyle: {
                        backgroundColor: colors.bg,
                        borderBottomWidth: 0,
                        shadowOpacity: 0,
                        elevation: 0,
                    },
                    headerTitleStyle: { ...typography.h3, color: colors.textPrimary },
                    headerRight: () => (
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    ),
                }}
            >
                <Tab.Screen
                    name="Scan"
                    component={ScanScreen}
                    options={{
                        title: 'Scan',
                        tabBarIcon: ({ color, size }) => (
                            <Text style={{ fontSize: size, color }}>📷</Text>
                        ),
                        headerTitle: `Hi, ${user.name}`,
                    }}
                />
                {user.isAdmin && (
                    <Tab.Screen
                        name="Admin"
                        component={AdminTabScreen}
                        options={{
                            title: 'Admin',
                            tabBarIcon: ({ color, size }) => (
                                <Text style={{ fontSize: size, color }}>⚙️</Text>
                            ),
                            headerTitle: 'Admin',
                        }}
                    />
                )}
            </Tab.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    logoutBtn: {
        marginRight: spacing.md,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.bgElevated,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logoutText: {
        ...typography.caption,
        color: colors.errorLight,
    },
});
