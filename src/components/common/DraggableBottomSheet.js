import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 0;
const HEADER_HEIGHT = 60;
const TOP_GAP = 20;

const MIN_HEIGHT = SCREEN_HEIGHT * 0.33;
const MAX_HEIGHT = SCREEN_HEIGHT - STATUS_BAR_HEIGHT - HEADER_HEIGHT - TOP_GAP;

export default function DraggableBottomSheet({
  children,
  visible,
  onHide,
  onExpansionChange,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastGesture = useRef(0);
  const isExpanded = useRef(false);

  const animateSheet = useCallback((toValue) => {
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 20,
    }).start(() => {
      lastGesture.current = toValue;
    });
  }, []);

  useEffect(() => {
    if (visible) {
      animateSheet(0);
      isExpanded.current = false;
      onExpansionChange && onExpansionChange(false);
    } else {
      const dragDistance = MAX_HEIGHT - MIN_HEIGHT;
      animateSheet(dragDistance);
      isExpanded.current = false;
      onExpansionChange && onExpansionChange(false);
    }
  }, [visible, animateSheet, onExpansionChange]);

  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,

      onPanResponderGrant: () => {
        translateY.setOffset(lastGesture.current);
        translateY.setValue(0);
      },

      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (_, gesture) => {
        translateY.flattenOffset();

        const velocity = gesture.vy;
        const currentY = lastGesture.current + gesture.dy;
        const dragDistance = MAX_HEIGHT - MIN_HEIGHT;

        let targetY = 0;
        let willBeExpanded = false;

        if (velocity > 1.2 || currentY > dragDistance * 0.5) {
          targetY = dragDistance;
          willBeExpanded = false;
          onHide && onHide();
        } else if (velocity < -0.5) {
          targetY = -dragDistance;
          willBeExpanded = true;
        } else if (velocity > 0.5) {
          targetY = 0;
          willBeExpanded = false;
        } else {
          if (currentY < -(dragDistance / 2)) {
            targetY = -dragDistance;
            willBeExpanded = true;
          } else if (currentY > dragDistance * 0.3) {
            targetY = dragDistance;
            willBeExpanded = false;
            onHide && onHide();
          } else {
            targetY = 0;
            willBeExpanded = false;
          }
        }

        isExpanded.current = willBeExpanded;
        onExpansionChange && onExpansionChange(willBeExpanded);
        animateSheet(targetY);
      },
    })
  ).current;

  const handleToggle = useCallback(() => {
    const dragDistance = MAX_HEIGHT - MIN_HEIGHT;
    const targetY = isExpanded.current ? 0 : -dragDistance;
    const willBeExpanded = !isExpanded.current;
    
    isExpanded.current = willBeExpanded;
    onExpansionChange && onExpansionChange(willBeExpanded);
    animateSheet(targetY);
  }, [animateSheet, onExpansionChange]);

  const dragDistance = MAX_HEIGHT - MIN_HEIGHT;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: MAX_HEIGHT,
          transform: [
            {
              translateY: translateY.interpolate({
                inputRange: [-dragDistance, 0, dragDistance],
                outputRange: [-dragDistance, 0, dragDistance],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.handleContainer} {...handlePanResponder.panHandlers}>
        <TouchableOpacity 
          style={styles.handleTouchArea}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <View style={styles.handleBar} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -(SCREEN_HEIGHT - STATUS_BAR_HEIGHT - HEADER_HEIGHT - TOP_GAP - SCREEN_HEIGHT * 0.33),
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },

  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 10,
  },

  handleTouchArea: {
    paddingVertical: 8,
    paddingHorizontal: 40,
  },

  handleBar: {
    width: 50,
    height: 4,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 2,
  },

  content: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
});