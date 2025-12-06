# Firestore Store Collection Setup Guide

## Creating Store Items

When creating documents in the `/store` collection, use this structure:

### Document Structure

Each store item document should have these fields:

```json
{
  "name": "Starter Pack",
  "type": "chips",
  "amount": 5000,
  "price": 4.99,
  "description": "Get started with 5000 chips",
  "image": "https://example.com/image.png",
  "available": true
}
```

### Example Store Items

#### 1. Chips Packages

**Document ID:** `chips_starter`
```json
{
  "name": "Starter Pack",
  "type": "chips",
  "amount": 5000,
  "price": 4.99,
  "description": "Perfect for beginners",
  "available": true
}
```

**Document ID:** `chips_medium`
```json
{
  "name": "Medium Pack",
  "type": "chips",
  "amount": 15000,
  "price": 12.99,
  "description": "Great value pack",
  "available": true
}
```

**Document ID:** `chips_large`
```json
{
  "name": "Large Pack",
  "type": "chips",
  "amount": 50000,
  "price": 39.99,
  "description": "Best value for serious players",
  "available": true
}
```

#### 2. Cosmetics - Avatars

**Document ID:** `avatar_gold`
```json
{
  "name": "Gold Avatar",
  "type": "avatar",
  "price": 1000,
  "description": "Exclusive gold avatar frame",
  "available": true,
  "category": "avatar"
}
```

**Document ID:** `avatar_diamond`
```json
{
  "name": "Diamond Avatar",
  "type": "avatar",
  "price": 2500,
  "description": "Premium diamond avatar frame",
  "available": true,
  "category": "avatar"
}
```

#### 3. Cosmetics - Card Backs

**Document ID:** `cardback_red`
```json
{
  "name": "Red Card Back",
  "type": "cardBack",
  "price": 500,
  "description": "Classic red card back design",
  "available": true,
  "category": "cardBack"
}
```

**Document ID:** `cardback_gold`
```json
{
  "name": "Gold Card Back",
  "type": "cardBack",
  "price": 1500,
  "description": "Luxurious gold card back",
  "available": true,
  "category": "cardBack"
}
```

#### 4. Cosmetics - Table Skins

**Document ID:** `table_classic`
```json
{
  "name": "Classic Table",
  "type": "tableSkin",
  "price": 2000,
  "description": "Traditional poker table design",
  "available": true,
  "category": "tableSkin"
}
```

**Document ID:** `table_luxury`
```json
{
  "name": "Luxury Table",
  "type": "tableSkin",
  "price": 5000,
  "description": "Premium luxury table design",
  "available": true,
  "category": "tableSkin"
}
```

## Step-by-Step Instructions

1. **Create the Collection:**
   - Collection ID: `store`
   - Click "Start collection"

2. **Add First Document:**
   - Document ID: You can use auto-ID or custom ID (like `chips_starter`)
   - Add fields one by one:
     - Field: `name`, Type: `string`, Value: `"Starter Pack"`
     - Field: `type`, Type: `string`, Value: `"chips"`
     - Field: `amount`, Type: `number`, Value: `5000`
     - Field: `price`, Type: `number`, Value: `4.99`
     - Field: `description`, Type: `string`, Value: `"Perfect for beginners"`
     - Field: `available`, Type: `boolean`, Value: `true`
   - Click "Save"

3. **Add More Documents:**
   - Click "Add document" to add more store items
   - Repeat the process for each item

## Quick Copy-Paste Values

For the first document you're creating:

**Field 1:**
- Field name: `name`
- Type: `string`
- Value: `Starter Pack`

**Field 2:**
- Field name: `type`
- Type: `string`
- Value: `chips`

**Field 3:**
- Field name: `amount`
- Type: `number`
- Value: `5000`

**Field 4:**
- Field name: `price`
- Type: `number`
- Value: `4.99`

**Field 5:**
- Field name: `description`
- Type: `string`
- Value: `Perfect for beginners`

**Field 6:**
- Field name: `available`
- Type: `boolean`
- Value: `true` (toggle it on)

## Notes

- For chips packages, include `amount` field
- For cosmetics, you don't need `amount` field
- Use `price` in chips (in-game currency), not real money
- Set `available: true` to make items visible in store
- You can add more fields like `image`, `rarity`, etc. as needed

