import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import DraggableBottomSheet from '../../components/common/DraggableBottomSheet';
import GalleryGrid from '../../components/common/GalleryGrid';

const MAX_PHOTOS = 8;
const PHOTOS_PER_PAGE = 100;

export default function ScanScreen({ navigation }) {
  // Camera permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  
  // Camera state
  const [cameraType, setCameraType] = useState('back');
  const cameraRef = useRef(null);
  
  // Photo state
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(true);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const endCursor = useRef(null);

  // Configure header with X button - only show when sheet is expanded
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => 
        isSheetExpanded ? (
          <TouchableOpacity
            onPress={() => setGalleryVisible(false)}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, isSheetExpanded]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      // Request camera permission
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      // Request media library permission
      if (!mediaPermission?.granted) {
        await requestMediaPermission();
      }

      // Load initial photos if we have permission
      if (mediaPermission?.granted) {
        loadInitialPhotos();
      }
    })();
  }, [mediaPermission?.granted]);

  // Load initial batch of photos
  const loadInitialPhotos = async () => {
    try {
      setLoading(true);
      
      const media = await MediaLibrary.getAssetsAsync({
        first: PHOTOS_PER_PAGE,
        mediaType: 'photo',
        sortBy: ['creationTime'],
      });

      if (media.assets && media.assets.length > 0) {
        setRecentPhotos(media.assets);
        endCursor.current = media.endCursor;
        setHasMore(media.hasNextPage);
      }
    } catch (error) {
      console.error('Error loading initial photos:', error);
      Alert.alert('Error', 'Could not load photos');
    } finally {
      setLoading(false);
    }
  };

  // Load more photos (infinite scroll)
  const loadMorePhotos = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);

      const media = await MediaLibrary.getAssetsAsync({
        first: PHOTOS_PER_PAGE,
        after: endCursor.current,
        mediaType: 'photo',
        sortBy: ['creationTime'],
      });

      if (media.assets && media.assets.length > 0) {
        setRecentPhotos((prev) => [...prev, ...media.assets]);
        endCursor.current = media.endCursor;
        setHasMore(media.hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Take photo with camera
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      // Save to media library
      if (mediaPermission?.granted) {
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        
        // Add to selected photos using the asset URI
        if (selectedPhotos.length < MAX_PHOTOS) {
          setSelectedPhotos([...selectedPhotos, asset.uri]);
          
          // Reload gallery to show new photo
          setTimeout(() => {
            endCursor.current = null;
            setHasMore(true);
            loadInitialPhotos();
          }, 500);
        } else {
          Alert.alert('Maximum Reached', `You can only select up to ${MAX_PHOTOS} photos`);
        }
      } else {
        // Just add the photo URI if no media library access
        if (selectedPhotos.length < MAX_PHOTOS) {
          setSelectedPhotos([...selectedPhotos, photo.uri]);
        } else {
          Alert.alert('Maximum Reached', `You can only select up to ${MAX_PHOTOS} photos`);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  // Flip camera
  const flipCamera = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  // Handle photo selection from gallery
  const handlePhotoPress = (uri) => {
    if (selectedPhotos.includes(uri)) {
      // Deselect
      setSelectedPhotos(selectedPhotos.filter((photo) => photo !== uri));
    } else {
      // Select
      if (selectedPhotos.length < MAX_PHOTOS) {
        setSelectedPhotos([...selectedPhotos, uri]);
      } else {
        Alert.alert('Maximum Reached', `You can only select up to ${MAX_PHOTOS} photos`);
      }
    }
  };

  // Continue to next step
  const handleContinue = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos Selected', 'Please select at least one photo');
      return;
    }

    // Get actual file URIs for selected photos
    const photoData = [];
    for (const uri of selectedPhotos) {
      try {
        // If it's a ph:// URI, get the actual file info
        if (uri.startsWith('ph://')) {
          const assetId = uri.replace('ph://', '').split('/')[0];
          const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
          photoData.push(assetInfo.localUri || assetInfo.uri);
        } else {
          // Regular file URI
          photoData.push(uri);
        }
      } catch (error) {
        console.error('Error getting asset info:', error);
        photoData.push(uri); // Fallback to original URI
      }
    }

    console.log('Selected photos with file URIs:', photoData);
    
    // Navigate to preview screen
    navigation.navigate('CardPreview', { selectedPhotos: photoData });
  };

  // Loading/Permission states
  if (!cameraPermission || !mediaPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.text}>Camera Access Required</Text>
        <Text style={styles.subtext}>
          CardVault needs camera access to scan your cards
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!mediaPermission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="images-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.text}>Photo Library Access Required</Text>
        <Text style={styles.subtext}>
          CardVault needs photo access to let you select card images
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestMediaPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Photo Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        <SafeAreaView style={styles.cameraOverlay} edges={['top']}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            {/* Gallery Toggle Button - LEFT */}
            <TouchableOpacity 
              style={styles.galleryButton} 
              onPress={() => setGalleryVisible(true)}
            >
              <Ionicons name="images" size={24} color={COLORS.white} />
              {selectedPhotos.length > 0 && (
                <View style={styles.galleryBadge}>
                  <Text style={styles.galleryBadgeText}>{selectedPhotos.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.spacer} />

            {/* Flip Camera Button - RIGHT */}
            <TouchableOpacity style={styles.iconButton} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Capture Button */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>

          {/* Selection Counter */}
          {selectedPhotos.length > 0 && (
            <View style={styles.selectionCounter}>
              <Text style={styles.counterText}>
                {selectedPhotos.length}/{MAX_PHOTOS}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </CameraView>

      {/* Draggable Bottom Sheet with Gallery */}
      <DraggableBottomSheet 
        visible={galleryVisible}
        onHide={() => setGalleryVisible(false)}
        onExpansionChange={setIsSheetExpanded}
      >
        <GalleryGrid
          photos={recentPhotos}
          selectedPhotos={selectedPhotos}
          onPhotoPress={handlePhotoPress}
          maxPhotos={MAX_PHOTOS}
          onLoadMore={loadMorePhotos}
          hasMore={hasMore}
          loading={loading}
        />
      </DraggableBottomSheet>

      {/* Continue Button (fixed at bottom) */}
      {selectedPhotos.length > 0 && (
        <View style={styles.continueButtonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              Continue with {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  galleryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  galleryBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  spacer: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
  },
  selectionCounter: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});