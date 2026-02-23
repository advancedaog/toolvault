import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { getItems } from '../store/inventoryStore';
import { InventoryItem } from '../types';

interface Props {
    onBack: () => void;
    onSelectItem: (itemId: string) => void;
}

export default function InventoryListScreen({ onBack, onSelectItem }: Props) {
    const [items, setItems] = useState<InventoryItem[]>([]);

    useEffect(() => {
        setItems(getItems());
    }, []);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Inventory</Text>
            <Text style={styles.subtitle}>{items.length} item{items.length !== 1 ? 's' : ''} in system</Text>

            {items.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyTitle}>No items yet</Text>
                    <Text style={styles.emptyText}>Use "Add New Item" to create your first item.</Text>
                </View>
            ) : (
                items.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.itemCard}
                        onPress={() => onSelectItem(item.id)}
                        activeOpacity={0.85}
                    >
                        {item.photoUri ? (
                            <Image source={{ uri: item.photoUri }} style={styles.itemPhoto} />
                        ) : (
                            <View style={styles.itemPhotoPlaceholder}>
                                <Text style={styles.placeholderEmoji}>📦</Text>
                            </View>
                        )}
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemId}>{item.id}</Text>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            {item.description ? (
                                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                            ) : null}
                            <View style={styles.itemMeta}>
                                <View style={[styles.miniStatus, item.isCheckedOut ? styles.miniStatusOut : styles.miniStatusIn]}>
                                    <Text style={styles.miniStatusText}>
                                        {item.isCheckedOut ? 'Out' : 'Available'}
                                    </Text>
                                </View>
                                {item.certificates.length > 0 && (
                                    <Text style={styles.certBadge}>📜 {item.certificates.length}</Text>
                                )}
                            </View>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))
            )}

            <View style={{ height: spacing.xxl }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingTop: spacing.xxl },
    backBtn: { marginBottom: spacing.md },
    backText: { ...typography.body, color: colors.primaryLight },
    title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },

    // Empty state
    emptyCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

    // Item card
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    itemPhoto: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        marginRight: spacing.md,
    },
    itemPhotoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    placeholderEmoji: { fontSize: 24 },
    itemInfo: { flex: 1 },
    itemId: { ...typography.caption, color: colors.primaryLight, fontWeight: '700', letterSpacing: 1 },
    itemName: { ...typography.bodyBold, color: colors.textPrimary },
    itemDesc: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
    itemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
    miniStatus: {
        borderRadius: borderRadius.full,
        paddingVertical: 2,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
    },
    miniStatusIn: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: colors.success },
    miniStatusOut: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: colors.warning },
    miniStatusText: { ...typography.small, color: colors.textSecondary },
    certBadge: { ...typography.small, color: colors.secondaryLight },
    arrow: {
        fontSize: 24,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
});
