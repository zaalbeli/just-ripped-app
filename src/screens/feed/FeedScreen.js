import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import databaseService from '../../services/database';

export default function FeedScreen() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadFeed();
    }, [])
  );

  const loadFeed = async () => {
    try {
      // Load recent cards from all users
      const recentCards = await databaseService.getRecentCards(20);
      setCards(recentCards || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const renderCardPost = ({ item }) => (
    <View style={styles.post}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>
            {item.profiles?.username?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.postUsername}>@{item.profiles?.username || 'user'}</Text>
          <Text style={styles.postTimestamp}>
            {formatTimestamp(item.created_at)}
          </Text>
        </View>
      </View>
  
      {/* Card Image */}
      <Image
        source={{ uri: item.image_front_url }}
        style={styles.postImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
  
      {/* Card Info */}
      <View style={styles.postInfo}>
        <View style={styles.postInfoRow}>
          <Text style={styles.postPlayer}>{item.player_name}</Text>
          <Text style={styles.postValue}>${item.estimated_value?.toFixed(0) || '0'}</Text>
        </View>
        <Text style={styles.postDetails}>
          {item.year} • {item.manufacturer} {item.brand} • {item.card_number}
        </Text>
        {item.condition && (
          <View style={styles.postCondition}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
            <Text style={styles.postConditionText}>{item.condition}</Text>
          </View>
        )}
      </View>
  
      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={24} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="swap-horizontal-outline" size={24} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>Trade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="planet-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>No cards in feed yet</Text>
      <Text style={styles.emptySubtext}>
        Be the first to share your collection!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        renderItem={renderCardPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={cards.length === 0 ? styles.emptyContainer : styles.feedContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

function formatTimestamp(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  feedContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  post: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  postTimestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  postImage: {
    width: '100%',
    aspectRatio: 4/5,
    backgroundColor: COLORS.background,
  },
  postInfo: {
    padding: 12,
  },
  postInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postPlayer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  postValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  postDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  postCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postConditionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});