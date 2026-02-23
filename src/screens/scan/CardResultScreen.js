import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import databaseService from '../../services/database';
import storageService from '../../services/storage';
import authService from '../../services/auth';

export default function CardResultScreen({ route, navigation }) {
  const { photoUri, cardData = {} } = route.params || {};

  // Simulated AI detection results
  const [cardInfo, setCardInfo] = useState({
    player_name: cardData.player_name || 'Mike Trout',
    year: cardData.year || '2021',
    manufacturer: cardData.manufacturer || 'Topps', // Topps, Panini, Upper Deck
    brand: cardData.brand || 'Chrome', // Chrome, Prizm, Select
    card_number: cardData.card_number || '#1',
    estimated_value: cardData.estimated_value || 125.00,
    condition: cardData.condition || 'Near Mint',
    sport: cardData.sport || 'Baseball',
    rookie_card: cardData.rookie_card || false,
    autograph: cardData.autograph || false,
  });

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleSaveToCollection = async () => {
    setSaving(true);

    try {
      // Upload image to Supabase Storage to get a persistent public URL
      const currentUser = await authService.getCurrentUser();
      let imageUrl = null;
      if (photoUri) {
        imageUrl = await storageService.uploadCardImage(currentUser.id, photoUri);
      }

      // Save to database with the public cloud URL
      const savedCard = await databaseService.addCard({
        player_name: cardInfo.player_name,
        year: parseInt(cardInfo.year),
        manufacturer: cardInfo.manufacturer,
        brand: cardInfo.brand,
        card_number: cardInfo.card_number,
        estimated_value: parseFloat(cardInfo.estimated_value),
        condition: cardInfo.condition,
        sport: cardInfo.sport,
        image_url: imageUrl,
        rookie_card: cardInfo.rookie_card,
        autograph: cardInfo.autograph,
      });

      // Success feedback
      Alert.alert(
        '🎉 Card Added!',
        `${cardInfo.player_name} has been added to your collection`,
        [
          {
            text: 'View Profile',
            onPress: () => {
              navigation.navigate('Profile');
            },
          },
          {
            text: 'Scan Another',
            onPress: () => {
              navigation.navigate('ScanMain');
            },
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save card to collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card Image */}
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: photoUri }}
            style={styles.cardImage}
            contentFit="contain"
          />
          
          {/* AI Badge */}
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={16} color={COLORS.white} />
            <Text style={styles.aiBadgeText}>AI Detected</Text>
          </View>

          {/* Special Features Badges */}
          <View style={styles.badges}>
            {cardInfo.rookie_card && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>RC</Text>
              </View>
            )}
            {cardInfo.autograph && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>AUTO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Card Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <TouchableOpacity
              onPress={() => setEditing(!editing)}
              style={styles.editButton}
            >
              <Ionicons 
                name={editing ? 'checkmark-circle' : 'pencil'} 
                size={24} 
                color={editing ? COLORS.primary : COLORS.textSecondary} 
              />
              <Text style={[styles.editButtonText, editing && styles.editButtonTextActive]}>
                {editing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Editable Fields */}
          <View style={styles.fieldsContainer}>
            {/* Player Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Player Name</Text>
              {editing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={cardInfo.player_name}
                  onChangeText={(text) => setCardInfo({ ...cardInfo, player_name: text })}
                  placeholder="Enter player name"
                  placeholderTextColor={COLORS.textSecondary}
                />
              ) : (
                <Text style={styles.fieldValue}>{cardInfo.player_name}</Text>
              )}
            </View>

            {/* Year & Manufacturer Row */}
            <View style={styles.fieldRow}>
              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Year</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={cardInfo.year}
                    onChangeText={(text) => setCardInfo({ ...cardInfo, year: text })}
                    placeholder="Year"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{cardInfo.year}</Text>
                )}
              </View>

              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Manufacturer</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={cardInfo.manufacturer}
                    onChangeText={(text) => setCardInfo({ ...cardInfo, manufacturer: text })}
                    placeholder="Topps, Panini"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{cardInfo.manufacturer}</Text>
                )}
              </View>
            </View>

            {/* Brand & Card Number Row */}
            <View style={styles.fieldRow}>
              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Brand</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={cardInfo.brand}
                    onChangeText={(text) => setCardInfo({ ...cardInfo, brand: text })}
                    placeholder="Chrome, Prizm"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{cardInfo.brand}</Text>
                )}
              </View>

              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Card Number</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={cardInfo.card_number}
                    onChangeText={(text) => setCardInfo({ ...cardInfo, card_number: text })}
                    placeholder="#"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{cardInfo.card_number}</Text>
                )}
              </View>
            </View>

            {/* Condition & Sport Row */}
            <View style={styles.fieldRow}>
              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Condition</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={cardInfo.condition}
                    onChangeText={(text) => setCardInfo({ ...cardInfo, condition: text })}
                    placeholder="Near Mint"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{cardInfo.condition}</Text>
                )}
              </View>

              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Sport</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={cardInfo.sport}
                    onChangeText={(text) => setCardInfo({ ...cardInfo, sport: text })}
                    placeholder="Baseball"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{cardInfo.sport}</Text>
                )}
              </View>
            </View>

            {/* Estimated Value */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Estimated Value</Text>
              {editing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={cardInfo.estimated_value.toString()}
                  onChangeText={(text) => setCardInfo({ ...cardInfo, estimated_value: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textSecondary}
                />
              ) : (
                <Text style={styles.fieldValueLarge}>${cardInfo.estimated_value.toFixed(2)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoNoteText}>
            Card details detected by AI. Review and edit if needed before saving.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveToCollection}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="add-circle" size={24} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Add to Collection</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.discardButton}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  cardImageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  aiBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  badges: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  editButtonTextActive: {
    color: COLORS.primary,
  },
  fieldsContainer: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
    paddingVertical: 8,
  },
  fieldValueLarge: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  fieldInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  infoNote: {
    flexDirection: 'row',
    margin: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoNoteText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  discardButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  discardButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});