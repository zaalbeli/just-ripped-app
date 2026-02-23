import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function GalleryGrid({
  photos,
  selectedPhotos,
  onPhotoPress,
  maxPhotos = 8,
  onLoadMore,
  hasMore,
  loading,
  onPullDown,
}) {
  const flatListRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  const isSelected = (uri) => selectedPhotos.includes(uri);
  const selectionIndex = (uri) => selectedPhotos.indexOf(uri) + 1;

  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    setScrollY(currentScrollY);

    if (currentScrollY < -60 && onPullDown) {
      onPullDown();
    }
  };

  const renderPhoto = ({ item }) => {
    const selected = isSelected(item.uri);
    const selIndex = selectionIndex(item.uri);

    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => onPhotoPress(item.uri)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.photo}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        {/* Selection Badge */}
        <View
          style={[
            styles.selectionBadge,
            selected && styles.selectedBadge,
          ]}
        >
          {selected && (
            <View style={styles.selectionInner}>
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          )}
        </View>

        {/* Selected Overlay */}
        {selected && <View style={styles.selectedOverlay} />}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item, index) =>
          `${item.id}-${index}-${item.uri.slice(-20)}`
        }
        numColumns={4}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews
        maxToRenderPerBatch={20}
        windowSize={10}
        bounces
        alwaysBounceVertical
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  grid: {
    paddingBottom: 140,
  },

  photoContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 3,
    maxWidth: '24%',
  },

  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },

  selectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedBadge: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  selectionInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 102, 255, 0.15)',
    borderRadius: 8,
  },

  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});