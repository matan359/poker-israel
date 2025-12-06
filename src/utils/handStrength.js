/**
 * Calculate hand strength from player cards + community cards
 * Returns: 'strong' (red), 'medium' (orange), 'weak' (green)
 */
import {
  analyzeHistogram,
  checkFlush,
  checkRoyalFlush,
  checkStraightFlush,
  checkStraight,
  buildValueSet
} from './cards.js';

const generateHistogram = (hand) => {
  const frequencyHistogram = {};
  const suitHistogram = {};
  
  hand.forEach(card => {
    frequencyHistogram[card.cardFace] = (frequencyHistogram[card.cardFace] || 0) + 1;
    suitHistogram[card.suit] = (suitHistogram[card.suit] || 0) + 1;
  });
  
  return { frequencyHistogram, suitHistogram };
};

export const calculateHandStrength = (playerCards, communityCards) => {
  // Need at least 2 player cards
  if (!playerCards || playerCards.length < 2) {
    return 'weak';
  }
  
  // Combine player cards with community cards
  const allCards = [...playerCards, ...(communityCards || [])];
  
  // Need at least 2 cards total to evaluate
  if (allCards.length < 2) {
    return 'weak';
  }
  
  // Sort cards by value (descending)
  const descendingSortHand = allCards.map(card => ({ ...card })).sort((a, b) => b.value - a.value);
  
  // Generate histograms
  const { frequencyHistogram, suitHistogram } = generateHistogram(descendingSortHand);
  
  // Check for various hand types
  const valueSet = buildValueSet(descendingSortHand);
  const { isFlush, flushedSuit } = checkFlush(suitHistogram);
  const flushCards = isFlush ? descendingSortHand.filter(card => card.suit === flushedSuit) : [];
  const isRoyalFlush = isFlush && checkRoyalFlush(flushCards);
  
  // checkStraightFlush returns an object with isStraightFlush property
  let isStraightFlush = false;
  if (isFlush && flushCards.length >= 5) {
    const straightFlushResult = checkStraightFlush(flushCards);
    isStraightFlush = straightFlushResult?.isStraightFlush || false;
  }
  
  // checkStraight returns an object with isStraight property
  const straightResult = checkStraight(valueSet);
  const isStraight = straightResult ? (straightResult.isStraight || false) : false;
  const { isFourOfAKind, isFullHouse, isThreeOfAKind, isTwoPair, isPair } = analyzeHistogram(descendingSortHand, frequencyHistogram);
  
  // Determine hand strength
  // Strong (red): Royal Flush, Straight Flush, Four of a Kind, Full House
  if (isRoyalFlush || isStraightFlush || isFourOfAKind || isFullHouse) {
    return 'strong';
  }
  
  // Medium (orange): Flush, Straight, Three of a Kind, Two Pair
  if (isFlush || isStraight || isThreeOfAKind || isTwoPair) {
    return 'medium';
  }
  
  // Weak (green): Pair, No Pair
  return 'weak';
};

