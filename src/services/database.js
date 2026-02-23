import { supabase } from '../config/supabase';

class DatabaseService {
  // ==================== PROFILE ====================
  
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // ==================== CARDS ====================

  async addCard(cardData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cards')
        .insert([{
          user_id: user.id,
          player_name: cardData.player_name,
          year: cardData.year,
          manufacturer: cardData.manufacturer, // Schema uses 'manufacturer'
          brand: cardData.brand, // Schema has separate 'brand' field
          card_number: cardData.card_number,
          estimated_value: cardData.estimated_value,
          condition: cardData.condition, // Added to schema
          sport: cardData.sport, // Added to schema
          image_front_url: cardData.image_url, // Schema uses 'image_front_url'
          rookie_card: cardData.rookie_card || false,
          autograph: cardData.autograph || false,
          memorabilia: cardData.memorabilia || false,
          graded: cardData.graded || false,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update profile stats
      await this.updateProfileStats(user.id);

      return data;
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  }

  async getUserCards(userId) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user cards:', error);
      throw error;
    }
  }

  async getRecentCards(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting recent cards:', error);
      throw error;
    }
  }

  async updateProfileStats(userId) {
    try {
      // Get all user's cards
      const cards = await this.getUserCards(userId);
      
      // Calculate stats
      const totalCards = cards.length;
      const totalValue = cards.reduce((sum, card) => sum + (card.estimated_value || 0), 0);

      // Update profile
      await this.updateProfile(userId, {
        total_cards: totalCards,
        total_collection_value: totalValue,
      });
    } catch (error) {
      console.error('Error updating profile stats:', error);
    }
  }

  async deleteCard(cardId, userId) {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update profile stats
      await this.updateProfileStats(userId);
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }
}

export default new DatabaseService();