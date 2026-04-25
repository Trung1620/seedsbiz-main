// app/product-new.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
    Image,
    Alert,
    Modal,
    FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { H } from "@/utils/href";
import * as api from "@/utils/api";
import { uploadImageUriToCloudinary } from "@/utils/uploadCloudinaryRN";
import { FONTS, SIZES, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import ScreenBackground from "@/components/ScreenBackground";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

type ImgDraft = { uri: string; colorName: string; colorCode: string };

export default function ProductNewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const productId = params.id as string;

    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { authReady, token, activeOrg } = useAuth();

    const [nameVi, setNameVi] = useState("");
    const [sku, setSku] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [brand, setBrand] = useState("");
    const [category, setCategory] = useState("");
    const [size, setSize] = useState("");
    const [priceVnd, setPriceVnd] = useState("");
    const [costPriceVnd, setCostPriceVnd] = useState("");
    const [priceUsd, setPriceUsd] = useState("");
    const [inStock, setInStock] = useState(true);
    const [barcode, setBarcode] = useState("");
    const [location, setLocation] = useState("");
    const [minStock, setMinStock] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [catModalVisible, setCatModalVisible] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [images, setImages] = useState<ImgDraft[]>([]);
    const [weight, setWeight] = useState("");
    const [unit, setUnit] = useState("cái");
    const [productionTime, setProductionTime] = useState("");
    const [saving, setSaving] = useState(false);

    // Fetch product for editing
    React.useEffect(() => {
        if (productId) {
            api.getProduct(productId).then(res => {
                if (res) {
                    setNameVi(res.nameVi || "");
                    setSku(res.sku || "");
                    setNameEn(res.nameEn || "");
                    setBrand(res.brand || "");
                    setCategory(res.category || "");
                    setCategoryId(res.categoryId || "");
                    setSize(res.size || "");
                    setPriceVnd(String(res.priceVnd || ""));
                    setCostPriceVnd(String(res.costPriceVnd || ""));
                    setPriceUsd(String(res.priceUsd || ""));
                    setBarcode(res.barcode || "");
                    setLocation(res.location || "");
                    setMinStock(String(res.minStock || ""));
                    setWeight(String(res.weight || ""));
                    setProductionTime(String(res.productionTime || ""));
                    setUnit(res.unit || "cái");
                    setCategoryName(res.category?.name || res.category || "");

                    if (res.materialDetails && Array.isArray(res.materialDetails)) {
                        setBoms(res.materialDetails.map((b: any) => ({
                            materialId: b.materialId,
                            name: b.material?.name || "Vật tư",
                            unit: b.material?.unit || "",
                            quantity: b.quantity
                        })));
                    }
                    
                    if (res.images && res.images.length > 0) {
                        const existingImages = res.images.map((img: any) => ({
                            uri: typeof img === 'string' ? img : img.url,
                            colorName: "default",
                            colorCode: "#000"
                        }));
                        setImages(existingImages);
                    }
                }
            });
        }
    }, [productId]);

    // BOM
    const [boms, setBoms] = useState<any[]>([]);
    const [materialModalVisible, setMaterialModalVisible] = useState(false);
    const [allMaterials, setAllMaterials] = useState<any[]>([]);
    const [fetchingMaterials, setFetchingMaterials] = useState(false);

    React.useEffect(() => {
        if (materialModalVisible) {
            setFetchingMaterials(true);
            api.listMaterials().then(res => {
                setAllMaterials(res || []);
            }).finally(() => setFetchingMaterials(false));
        }
    }, [materialModalVisible]);

    React.useEffect(() => {
        api.listCategories({ type: 'PRODUCT' }).then(res => {
            setCategories(res || []);
        });
    }, []);

    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert(t('common.error'), t('products.permissionDenied')); return; }
        const rs = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
        });
        if (rs.canceled) return;
        const uri = rs.assets?.[0]?.uri;
        if (uri) setImages((prev) => [{ uri, colorName: "default", colorCode: "#000000" }, ...prev]);
    };

    const removeImage = (uri: string) => setImages((prev) => prev.filter((x) => x.uri !== uri));

    const onSave = async () => {
        if ((!nameVi.trim() && !nameEn.trim()) || images.length === 0) {
            return Alert.alert(t('common.info'), t('products.alertMissingInfo'));
        }
        setSaving(true);
        try {
            const uploaded: string[] = [];
            for (const img of images) {
                if (img.uri.startsWith("http")) {
                    uploaded.push(img.uri);
                } else {
                    const url = await uploadImageUriToCloudinary(img.uri);
                    uploaded.push(url);
                }
            }

            const payload = {
                nameVi: nameVi.trim() || undefined,
                sku: sku.trim() || undefined,
                nameEn: nameEn.trim() || undefined,
                priceVnd: priceVnd ? Number(priceVnd) : undefined,
                costPriceVnd: costPriceVnd ? Number(costPriceVnd) : undefined,
                priceUsd: priceUsd ? Number(priceUsd) : undefined,
                size: size.trim() || undefined,
                brand: brand.trim(),
                category: category.trim(),
                unit: unit.trim() || "cái",
                inStock,
                status: "ACTIVE",
                weight: weight ? Number(weight) : undefined,
                productionTime: productionTime ? Number(productionTime) : undefined,
                images: uploaded,
                image: uploaded.length > 0 ? uploaded[0] : undefined,
                barcode: barcode.trim() || undefined,
                location: location.trim() || undefined,
                minStock: minStock ? Number(minStock) : undefined,
                categoryId: categoryId || undefined,
                materialDetails: boms.length > 0 ? boms.map(b => ({ materialId: b.materialId, quantity: b.quantity })) : undefined,
                orgId: activeOrg?.id,
            };

            if (productId) {
                await api.updateProduct(productId, payload);
                Alert.alert(t('common.success'), t('common.updateSuccess'));
            } else {
                await api.createProduct(payload);
                Alert.alert(t('common.success'), t('products.alertSuccess'));
            }
            router.replace(H("/products") as any);
        } catch (e: any) { Alert.alert(t('common.error'), e?.message || t('products.alertError')); }
        finally { setSaving(false); }
    };

    const InputField = ({ label, value, onChange, placeholder, keyboardType, autoCaps }: any) => (
        <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary + '70'}
                style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.outline }]}
                keyboardType={keyboardType || 'default'}
                autoCapitalize={autoCaps || 'none'}
            />
        </View>
    );

    return (
        <ScreenBackground style={{ paddingTop: insets.top }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={s.header}>
                    <Pressable style={[s.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <View>
                        <Text style={[s.h1, { color: colors.text }]}>{productId ? t('products.editTitle') : t('products.addNew')}</Text>
                    </View>
                </View>

                {/* THÔNG TIN CƠ BẢN */}
                <View style={[s.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
                    <InputField label={t('products.skuLabel')} value={sku} onChange={setSku} placeholder="SKU-888" autoCaps="characters" />
                    <InputField label={t('products.nameViLabel')} value={nameVi} onChange={setNameVi} placeholder={t('products.placeholderNameVi')} />
                    <InputField label={t('products.nameEnLabel')} value={nameEn} onChange={setNameEn} placeholder={t('products.placeholderNameEn')} />
                </View>

                {/* THƯƠNG HIỆU & PHÂN LOẠI */}
                <View style={[s.card, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
                    <View style={s.row}>
                        <InputField label={t('products.brandLabel')} value={brand} onChange={setBrand} placeholder={t('products.placeholderBrand')} />
                        <View style={s.inputGroup}>
                            <Text style={[s.label, { color: colors.textSecondary }]}>{t('products.categoryLabel')}</Text>
                            <Pressable
                                onPress={() => setCatModalVisible(true)}
                                style={[s.input, { backgroundColor: colors.background, borderColor: colors.outline, justifyContent: 'center' }]}
                            >
                                <Text style={{ color: categoryName ? colors.text : colors.textSecondary + '70' }}>
                                    {categoryName || t('extra.selectCategory')}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                    <View style={s.row}>
                        <InputField label={t('products.sizeLabel')} value={size} onChange={setSize} placeholder="25 x 15 x 10" />
                        <InputField label={t('extra.barcodeLabel')} value={barcode} onChange={setBarcode} placeholder="893..." />
                    </View>
                    <View style={s.row}>
                        <InputField label={t('common.unit', { defaultValue: 'Đơn vị tính' })} value={unit} onChange={setUnit} placeholder="cái, bộ, chiếc..." />
                    </View>
                </View>

                {/* VỊ TRÍ & ĐỊNH MỨC KHO */}
                <View style={[s.card, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
                    <View style={s.row}>
                        <InputField label={t('extra.locationLabel')} value={location} onChange={setLocation} placeholder="Kệ A1" />
                        <InputField label={t('extra.minStockLabel')} value={minStock} onChange={setMinStock} placeholder="10" keyboardType="numeric" />
                    </View>
                    <View style={s.row}>
                        <InputField label={t('extra.weightLabel')} value={weight} onChange={setWeight} placeholder="0.5" keyboardType="numeric" />
                        <InputField label={t('extra.productionTimeLabel')} value={productionTime} onChange={setProductionTime} placeholder="120" keyboardType="numeric" />
                    </View>
                </View>

                {/* GIÁ CẢ & TỒN KHO */}
                <View style={[s.card, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
                    <View style={s.row}>
                        <InputField label={t('products.priceLabel')} value={priceVnd} onChange={setPriceVnd} placeholder="150,000" keyboardType="numeric" />
                        <InputField label={t('products.costLabel')} value={costPriceVnd} onChange={setCostPriceVnd} placeholder="90,000" keyboardType="numeric" />
                    </View>
                    <View style={s.switchRow}>
                        <Text style={[s.label, { color: colors.textSecondary, marginBottom: 0 }]}>{t('products.stockStatus')}</Text>
                        <Pressable onPress={() => setInStock(!inStock)} style={[s.toggle, { backgroundColor: inStock ? PALETTE.primary : colors.background }]}>
                            <Text style={[s.toggleText, { color: inStock ? '#FFFFFF' : colors.textSecondary }]}>{inStock ? t('products.inStock') : t('products.outOfStock')}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* ĐỊNH MỨC VẬT TƯ (BOM) */}
                <View style={[s.card, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
                    <View style={s.imageHeader}>
                        <Text style={[s.label, { color: colors.textSecondary, marginBottom: 0 }]}>{t('extra.bomTitle')}</Text>
                        <Pressable onPress={() => setMaterialModalVisible(true)} style={[s.addImgBtn, { backgroundColor: PALETTE.primary + '15' }]}>
                            <MaterialIcons name="playlist-add" size={24} color={PALETTE.primary} />
                        </Pressable>
                    </View>

                    {boms.map((b: any) => (
                        <View key={b.materialId} style={s.bomRow}>
                            <View style={s.bomInfo}>
                                <Text style={[s.bomName, { color: colors.text }]}>{b.name}</Text>
                                <Text style={[s.bomUnit, { color: colors.textSecondary }]}>{b.unit}</Text>
                            </View>
                            <View style={s.bomQtyControls}>
                                <TextInput
                                    value={String(b.quantity)}
                                    onChangeText={(val) => {
                                        const nList = boms.map((item: any) =>
                                            item.materialId === b.materialId ? { ...item, quantity: Number(val) } : item
                                        );
                                        setBoms(nList);
                                    }}
                                    keyboardType="numeric"
                                    style={[s.bomInput, { backgroundColor: colors.background, color: colors.text }]}
                                />
                                <Pressable onPress={() => setBoms(boms.filter((x: any) => x.materialId !== b.materialId))} style={s.bomRemove}>
                                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                                </Pressable>
                            </View>
                        </View>
                    ))}
                    {boms.length === 0 && <Text style={s.emptyImgText}>{t('extra.noBom')}</Text>}
                </View>

                {/* HÌNH ẢNH */}
                <View style={[s.card, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
                    <View style={s.imageHeader}>
                        <Text style={[s.label, { color: colors.textSecondary, marginBottom: 0 }]}>{t('products.imageLabel')}</Text>
                        <Pressable onPress={pickImage} style={[s.addImgBtn, { backgroundColor: PALETTE.primary + '15' }]}>
                            <MaterialIcons name="add-a-photo" size={20} color={PALETTE.primary} />
                        </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageGrid}>
                        {images.map((img) => (
                            <View key={img.uri} style={s.imageItem}>
                                <Image source={{ uri: img.uri }} style={s.imageThumb} />
                                <Pressable onPress={() => removeImage(img.uri)} style={s.removeBtn}>
                                    <MaterialIcons name="close" size={16} color="#FFFFFF" />
                                </Pressable>
                            </View>
                        ))}
                        {images.length === 0 && <Text style={s.emptyImgText}>{t('products.noImageSelected')}</Text>}
                    </ScrollView>
                </View>

                {/* NÚT TẠO */}
                <View style={{ paddingHorizontal: 24, marginTop: 30 }}>
                    <Pressable style={[s.primaryBtn, { backgroundColor: PALETTE.primary, opacity: saving ? 0.7 : 1 }]} onPress={onSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.primaryBtnText}>{productId ? t('common.saveChanges') : t('products.createBtn')}</Text>}
                    </Pressable>
                </View>

                {/* MODAL CHỌN VẬT TƯ */}
                <Modal visible={materialModalVisible} animationType="slide" transparent>
                    <View style={s.modalOverlay}>
                        <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={s.modalHeader}>
                                <Text style={[s.modalTitle, { color: colors.text }]}>{t('extra.selectMaterial')}</Text>
                                <Pressable onPress={() => setMaterialModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </Pressable>
                            </View>
                            {fetchingMaterials ? (
                                <ActivityIndicator size="large" color={PALETTE.primary} style={{ marginTop: 20 }} />
                            ) : (
                                <FlatList
                                    data={allMaterials}
                                    keyExtractor={(m) => m.id}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            style={s.materialOption}
                                            onPress={() => {
                                                if (!boms.find(x => x.materialId === item.id)) {
                                                    setBoms([...boms, { materialId: item.id, name: item.name, unit: item.unit, quantity: 1 }]);
                                                }
                                                setMaterialModalVisible(false);
                                            }}
                                        >
                                            <Text style={[s.materialName, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={[s.materialUnit, { color: colors.textSecondary }]}>{item.unit}</Text>
                                        </Pressable>
                                    )}
                                />
                            )}
                        </View>
                    </View>
                </Modal>

                {/* MODAL CHỌN DANH MỤC */}
                <Modal visible={catModalVisible} animationType="slide" transparent>
                    <View style={s.modalOverlay}>
                        <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={s.modalHeader}>
                                <Text style={[s.modalTitle, { color: colors.text }]}>{t('extra.selectCategory')}</Text>
                                <Pressable onPress={() => setCatModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </Pressable>
                            </View>
                            <FlatList
                                data={categories}
                                keyExtractor={(c) => c.id}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={s.materialOption}
                                        onPress={() => {
                                            setCategoryId(item.id);
                                            setCategoryName(item.name);
                                            setCatModalVisible(false);
                                        }}
                                    >
                                        <Text style={[s.materialName, { color: colors.text }]}>{item.name}</Text>
                                    </Pressable>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

            </ScrollView>
        </ScreenBackground>
    );
}

const s = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 20, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", ...SHADOWS.soft },
    h1: { fontSize: 28, fontFamily: FONTS.bold },
    muted: { fontSize: 13, fontFamily: FONTS.medium, opacity: 0.7 },
    card: { marginHorizontal: 24, padding: 24, ...SHADOWS.soft },
    inputGroup: { flex: 1, marginBottom: 15 },
    label: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },
    input: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: FONTS.medium, borderWidth: 1 },
    row: { flexDirection: "row", gap: 15 },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
    toggle: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
    toggleText: { fontSize: 11, fontFamily: FONTS.bold },
    imageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    addImgBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    imageGrid: { gap: 12 },
    imageItem: { width: 100, height: 100 },
    imageThumb: { width: 100, height: 100, borderRadius: 16 },
    removeBtn: { position: "absolute", top: -5, right: -5, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
    emptyImgText: { fontSize: 13, fontFamily: FONTS.medium, color: '#999', fontStyle: 'italic' },
    primaryBtn: { paddingVertical: 20, borderRadius: 20, alignItems: "center", ...SHADOWS.soft },
    primaryBtnText: { color: "#FFFFFF", fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 1 },
    // BOM
    bomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    bomInfo: { flex: 2 },
    bomName: { fontSize: 15, fontFamily: FONTS.bold },
    bomUnit: { fontSize: 12, opacity: 0.6 },
    bomQtyControls: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    bomInput: { width: 60, height: 40, borderRadius: 8, textAlign: 'center', fontSize: 14, fontFamily: FONTS.bold },
    bomRemove: { padding: 5 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingBottom: 50, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, marginBottom: 10 },
    modalTitle: { fontSize: 20, fontFamily: FONTS.bold },
    materialOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    materialName: { fontSize: 16, fontFamily: FONTS.medium },
    materialUnit: { fontSize: 14, opacity: 0.6 },
});
