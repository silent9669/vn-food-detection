import React, {useState} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {Card, Button, Divider} from 'react-native-paper';
import {NutritionInfo, FoodDetection} from '../types/detection';
import {ItemNutrition} from '../utils/nutritionCalculator';

interface NutritionCardProps {
  totalNutrition: NutritionInfo;
  items: ItemNutrition[];
  showDetailsInitially?: boolean;
}

const NutritionCard: React.FC<NutritionCardProps> = ({
  totalNutrition,
  items,
  showDetailsInitially = false,
}) => {
  const [showDetails, setShowDetails] = useState(showDetailsInitially);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const formatValue = (value: number, unit: string): string => {
    return `${Math.round(value)}${unit}`;
  };

  const renderNutrientRow = (
    label: string,
    value: number,
    unit: string,
    color: string,
  ) => (
    <View style={styles.nutrientRow}>
      <View style={[styles.colorIndicator, {backgroundColor: color}]} />
      <Text style={styles.nutrientLabel}>{label}</Text>
      <Text style={styles.nutrientValue}>{formatValue(value, unit)}</Text>
    </View>
  );

  const renderDetailedBreakdown = () => {
    if (!showDetails || items.length === 0) {
      return null;
    }

    return (
      <View style={styles.detailsContainer}>
        <Divider style={styles.divider} />
        <Text style={styles.detailsTitle}>Detailed Breakdown</Text>
        {items.map((item, index) => (
          <View key={`${item.dishName}-${index}`} style={styles.itemContainer}>
            <Text style={styles.itemName}>
              {item.dishName} {item.count > 1 ? `(x${item.count})` : ''}
            </Text>
            <View style={styles.itemNutrients}>
              <Text style={styles.itemNutrient}>
                {formatValue(item.calories, ' kcal')}
              </Text>
              <Text style={styles.itemNutrient}>
                P: {formatValue(item.protein, 'g')}
              </Text>
              <Text style={styles.itemNutrient}>
                C: {formatValue(item.carbohydrates, 'g')}
              </Text>
              <Text style={styles.itemNutrient}>
                F: {formatValue(item.fat, 'g')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>Nutritional Information</Text>
        <Text style={styles.subtitle}>Total per serving</Text>

        <View style={styles.nutrientsContainer}>
          {renderNutrientRow('Calories', totalNutrition.calories, ' kcal', '#FF6B6B')}
          {renderNutrientRow('Protein', totalNutrition.protein, 'g', '#4ECDC4')}
          {renderNutrientRow('Carbohydrates', totalNutrition.carbohydrates, 'g', '#FFE66D')}
          {renderNutrientRow('Fat', totalNutrition.fat, 'g', '#95E1D3')}
        </View>

        {renderDetailedBreakdown()}

        {items.length > 0 && (
          <Button
            mode="text"
            onPress={toggleDetails}
            style={styles.toggleButton}
            icon={showDetails ? 'chevron-up' : 'chevron-down'}>
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderRadius: Platform.select({ios: 16, android: 12}),
  },
  title: {
    fontSize: 20,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  nutrientsContainer: {
    marginTop: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.select({ios: 14, android: 12}),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECF0F1',
  },
  colorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  nutrientLabel: {
    flex: 1,
    fontSize: 16,
    color: '#34495E',
    fontWeight: '500',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    color: '#2C3E50',
  },
  toggleButton: {
    marginTop: 8,
  },
  detailsContainer: {
    marginTop: 16,
  },
  divider: {
    marginBottom: 16,
    backgroundColor: '#BDC3C7',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    color: '#2C3E50',
    marginBottom: 12,
  },
  itemContainer: {
    marginBottom: 12,
    padding: Platform.select({ios: 14, android: 12}),
    backgroundColor: '#F8F9FA',
    borderRadius: Platform.select({ios: 10, android: 8}),
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  itemNutrients: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemNutrient: {
    fontSize: 13,
    color: '#7F8C8D',
  },
});

const MemoizedNutritionCard = React.memo(NutritionCard);

export default MemoizedNutritionCard;
