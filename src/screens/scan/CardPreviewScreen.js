import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function CardPreviewScreen({ route, navigation }) {
  const { selectedPhotos = [] } = route.params || {};
  
  const [processing, setProcessing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please select photos first', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [selectedPhotos, navigation]);

  const handleStartProcessing = () => {
    setProcessing(true);
    setCurrentPhotoIndex(0);

    // Simulate AI processing for each photo
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setCurrentPhotoIndex(index);

      if (index >= selectedPhotos.length) {
        clearInterval(interval);
        setTimeout(() => {
          setProcessing(false);
          
          // Navigate to card result screen with first photo
          // In production, this would process all photos and show results
          navigation.navigate('CardResult', {
            photoUri: selectedPhotos[0],
            cardData: {
              // Simulated AI detection results
              player_name: 'Mike Trout',
              year: '2021',
              brand: 'Topps Chrome',
              card_number: '#1',
              estimated_value: 125.00,
              condition: 'Near Mint',
              sport: 'Baseball',
            },
          });
        }, 500);
      }
    }, 1500);
  };

  const handleRemovePhoto = (index) => {
    Alert.alert(
      'Remove Photo',
      'Remove this photo from scanning?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = selectedPhotos.filter((_, i) => i !== index);
            if (updatedPhotos.length === 0) {
              navigation.goBack();
            } else {
              navigation.setParams({ selectedPhotos: updatedPhotos });
            }
          },
        },
      ]
    );
  };

  if (processing) {
    return (
      <SafeAreaView style={styles.processingContainer} edges={['bottom']}>
        <View style={styles.processingContent}>
          <View style={styles.processingImageContainer}>
            {currentPhotoIndex < selectedPhotos.length && (
              <Image
                source={{ uri: selectedPhotos[currentPhotoIndex] }}
                style={styles.processingImage}
                contentFit="contain"
              />
            )}
          </View>

          <View style={styles.progressSection}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingTitle}>Analyzing Card...</Text>
            <Text style={styles.processingSubtitle}>
              Photo {Math.min(currentPhotoIndex + 1, selectedPhotos.length)} of {selectedPhotos.length}
            </Text>

            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${((currentPhotoIndex + 1) / selectedPhotos.length) * 100}%` }
                ]} 
              />
            </View>

            <Text style={styles.processingHint}>
              Detecting player, year, brand, and card details...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Your Photos</Text>
          <Text style={styles.subtitle}>
            {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} ready to scan
          </Text>
        </View>

        <View style={styles.photoGrid}>
          {selectedPhotos.map((photo, index) => (
            <View key={index} style={styles.photoCard}>
              <Image
                source={{ uri: photo }}
                style={styles.photoImage}
                contentFit="cover"
              />
              
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>{index + 1}</Text>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePhoto(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={28} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Get the best results</Text>
            <Text style={styles.infoText}>
              • Clear, well-lit photos{'\n'}
              • Card fills most of the frame{'\n'}
              • Avoid glare and shadows
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStartProcessing}
          activeOpacity={0.8}
        >
          <Ionicons name="scan" size={24} color={COLORS.white} />
          <Text style={styles.scanButtonText}>
            Scan {selectedPhotos.length} Card{selectedPhotos.length > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Add More Photos</Text>
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
    paddingBottom: 180,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  photoCard: {
    width: '47%',
    aspectRatio: 3/4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
  },
  infoCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomButtonContainer: {
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
  scanButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  processingImageContainer: {
    width: '100%',
    height: '50%',
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  processingImage: {
    width: '100%',
    height: '100%',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  processingSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  processingHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});