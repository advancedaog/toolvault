import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { addItem } from '../store/inventoryStore';
import { InventoryItem } from '../types';
import QRCode from 'react-native-qrcode-svg';

const isWeb = Platform.OS === 'web';

interface Props {
    onBack: () => void;
}

export default function AddItemScreen({ onBack }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [createdItem, setCreatedItem] = useState<InventoryItem | null>(null);
    const [error, setError] = useState('');
    const qrRef = useRef<any>(null);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            setError('Camera access is required to take photos.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
        });
        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
            setError('');
        }
    };

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setError('Photo library access is required.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
        });
        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
            setError('');
        }
    };

    const handleAdd = () => {
        if (!name.trim()) {
            setError('Please enter an item name.');
            return;
        }
        setError('');
        const item = addItem(name.trim(), description.trim(), photoUri);
        setCreatedItem(item);
    };

    const handlePrintQR = async () => {
        if (!createdItem) return;
        const html = `
      <html>
        <head>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, sans-serif; }
            .label { text-align: center; margin-top: 16px; }
            .id { font-size: 24px; font-weight: bold; }
            .name { font-size: 16px; color: #666; margin-top: 4px; }
            img { width: 200px; height: 200px; }
          </style>
        </head>
        <body>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdItem.id)}" />
          <div class="label">
            <div class="id">${createdItem.id}</div>
            <div class="name">${createdItem.name}</div>
          </div>
        </body>
      </html>
    `;
        await Print.printAsync({ html });
    };

    const handleAddAnother = () => {
        setName('');
        setDescription('');
        setPhotoUri(null);
        setCreatedItem(null);
    };

    // ── Success State ──
    if (createdItem) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>‹ Back</Text>
                </TouchableOpacity>

                <View style={styles.successCard}>
                    <Text style={styles.successEmoji}>✅</Text>
                    <Text style={styles.successTitle}>Item Added!</Text>

                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>{createdItem.id}</Text>
                    </View>

                    {createdItem.photoUri && (
                        <Image source={{ uri: createdItem.photoUri }} style={styles.previewImage} />
                    )}

                    <Text style={styles.itemName}>{createdItem.name}</Text>
                    {createdItem.description ? (
                        <Text style={styles.itemDesc}>{createdItem.description}</Text>
                    ) : null}

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={createdItem.id}
                            size={180}
                            color="#000"
                            backgroundColor="#fff"
                            getRef={(ref: any) => (qrRef.current = ref)}
                        />
                    </View>

                    <TouchableOpacity style={styles.printButton} onPress={handlePrintQR} activeOpacity={0.8}>
                        <Text style={styles.printButtonText}>🖨️  Print QR Code</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleAddAnother} activeOpacity={0.8}>
                        <Text style={styles.secondaryButtonText}>+ Add Another Item</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={onBack} activeOpacity={0.8}>
                        <Text style={styles.secondaryButtonText}>Back to Admin</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // ── Form State ──
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Add New Item</Text>
            <Text style={styles.subtitle}>{isWeb ? 'Upload a photo and add to inventory' : 'Take a photo and add to inventory'}</Text>

            {/* Error Banner */}
            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            ) : null}

            {/* Photo */}
            <View style={styles.photoSection}>
                {photoUri ? (
                    <View>
                        <Image source={{ uri: photoUri }} style={styles.photo} />
                        <TouchableOpacity style={styles.retakeBtn} onPress={isWeb ? pickPhoto : takePhoto}>
                            <Text style={styles.retakeBtnText}>{isWeb ? 'Change' : 'Retake'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Text style={styles.photoEmoji}>📷</Text>
                        <View style={styles.photoButtons}>
                            {!isWeb && (
                                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.8}>
                                    <Text style={styles.photoBtnText}>Take Photo</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.photoBtn, isWeb ? {} : styles.photoBtnAlt]}
                                onPress={pickPhoto}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.photoBtnText}>{isWeb ? 'Upload Photo' : 'Choose Photo'}</Text>
                            </TouchableOpacity>
                        </View>
                        {isWeb && (
                            <Text style={styles.webHintText}>📱 Take Photo is available on mobile devices via Expo Go</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Name */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Pressure Gauge 300psi"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Optional description, serial number, etc."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.8}>
                <Text style={styles.addButtonText}>Add Item & Generate QR</Text>
            </TouchableOpacity>
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
    photoSection: { marginBottom: spacing.lg },
    photoPlaceholder: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    photoEmoji: { fontSize: 48, marginBottom: spacing.md },
    photoButtons: { flexDirection: 'row', gap: spacing.sm },
    photoBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        ...shadows.button,
    },
    photoBtnAlt: { backgroundColor: colors.bgElevated },
    photoBtnText: { ...typography.caption, color: colors.white, fontWeight: '600' },
    photo: {
        width: '100%',
        height: 250,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.bgCard,
    },
    retakeBtn: {
        position: 'absolute',
        bottom: spacing.sm,
        right: spacing.sm,
        backgroundColor: colors.overlay,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    retakeBtnText: { ...typography.caption, color: colors.white },
    inputContainer: { marginBottom: spacing.md },
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
    textArea: { height: 80, textAlignVertical: 'top' },
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.error,
    },
    errorText: { ...typography.body, color: colors.errorLight },
    webHintText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
    addButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
        ...shadows.button,
    },
    addButtonText: { ...typography.bodyBold, color: colors.white },

    // Success state
    successCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    successEmoji: { fontSize: 48, marginBottom: spacing.sm },
    successTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
    idBadge: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    idText: { ...typography.h3, color: colors.white, letterSpacing: 2 },
    previewImage: {
        width: 120,
        height: 120,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    itemName: { ...typography.h3, color: colors.textPrimary },
    itemDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
    qrContainer: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginVertical: spacing.lg,
    },
    printButton: {
        backgroundColor: colors.success,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        width: '100%',
        marginBottom: spacing.sm,
    },
    printButtonText: { ...typography.bodyBold, color: colors.white },
    secondaryButton: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        width: '100%',
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryButtonText: { ...typography.body, color: colors.primaryLight },
});
