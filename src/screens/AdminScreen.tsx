import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface Props {
    onAddItem: () => void;
    onAddCertificate: () => void;
    onViewInventory: () => void;
}

export default function AdminScreen({ onAddItem, onAddCertificate, onViewInventory }: Props) {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Manage inventory items and certificates</Text>

            <TouchableOpacity style={styles.card} onPress={onViewInventory} activeOpacity={0.85}>
                <View style={[styles.cardIcon, { borderColor: colors.success }]}>
                    <Text style={styles.cardEmoji}>📋</Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>View Inventory</Text>
                    <Text style={styles.cardDesc}>
                        Browse items, reprint QR codes, and view certificates
                    </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={onAddItem} activeOpacity={0.85}>
                <View style={styles.cardIcon}>
                    <Text style={styles.cardEmoji}>📸</Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>Add New Item</Text>
                    <Text style={styles.cardDesc}>
                        Take a photo, generate a unique ID and printable QR code
                    </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={onAddCertificate} activeOpacity={0.85}>
                <View style={[styles.cardIcon, { borderColor: colors.secondary }]}>
                    <Text style={styles.cardEmoji}>📜</Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>Add Certificate</Text>
                    <Text style={styles.cardDesc}>
                        Upload a calibration certificate to an existing item
                    </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    content: {
        padding: spacing.lg,
        paddingTop: spacing.xxl,
    },
    title: {
        ...typography.h1,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        marginRight: spacing.md,
    },
    cardEmoji: {
        fontSize: 26,
    },
    cardBody: {
        flex: 1,
    },
    cardTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    cardDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    arrow: {
        fontSize: 28,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
});
