# Semantic Search Test Keywords

## Test the documents by searching for these conceptual terms:

### 🍎 Food/Fruit Concepts
- **"fruit"** → Should find: apples, bananas, oranges, berries
- **"food"** → Should find: apples, bananas, breakfast items, nutrition content

### 🐾 Animal Concepts  
- **"animal"** → Should find: dog, cat, lions, elephants, birds, wildlife
- **"pet"** → Should find: dog (Max), cat (Luna)

### 💻 Technology Concepts
- **"technology"** → Should find: computer, software, applications, digital, smartphone
- **"tech"** → Should find: computer systems, software development, apps
- **"app"** → Should find: applications, software tools, mobile apps
- **"digital"** → Should find: digital transformation, digital photography, platforms

### 🏢 Business Concepts
- **"business"** → Should find: company, enterprise, corporation, startup, management
- **"company"** → Should find: organization, enterprise, business operations
- **"startup"** → Should find: company culture, business initiatives

### 🎨 Color Concepts
- **"color"** → Should find: blue, green, red, yellow, purple, black, white

### Exact Word Tests (Should still work)
- **"Max"** → Should find the dog's name
- **"basketball"** → Should find sports content
- **"university"** → Should find education content

### Advanced Semantic Tests
- **"innovation"** → Should find: technology, startup culture, creative solutions
- **"nutrition"** → Should find: healthy food, fruits, vegetables
- **"exercise"** → Should find: sports, swimming, hiking, gym activities

## How to Test:

1. **Upload one or both test documents** using the document upload feature
2. **Search using the conceptual terms** listed above
3. **Check the console logs** to see:
   - Semantic expansion: `🧠 Expanding semantic term "fruit" with: ["apple", "apples", "banana", "bananas", ...]`
   - Document matching: `🔍 "test-document.txt": semantic=0.456, keyword=0.200, final=0.456, type=hybrid`
   - Threshold decisions: `🎯 "test-document.txt": threshold=0.15, passed=true`

## Expected Results:

### ✅ Should Find Documents:
- Search "fruit" → Finds documents (semantic match via apples/bananas)
- Search "animal" → Finds documents (semantic match via dog/cat/lions)
- Search "technology" → Finds documents (semantic match via computer/software)
- Search "business" → Finds documents (semantic match via company/enterprise)

### ❌ Should NOT Find (concepts not mapped yet):
- Search "vehicle" → May not find transportation content
- Search "sport" → May not find sports content (not in semantic mappings)
- Search "school" → May not find education content

## Debugging Tips:

- **Open browser console** (F12) to see detailed search logs
- **Watch for semantic expansion** messages showing concept mapping
- **Check threshold decisions** to see if documents pass the relevance test
- **Verify hybrid vs semantic vs keyword** search types

## Add Your Own Concepts:

To add new semantic mappings, edit `src/services/simpleEmbeddingService.ts` and add entries to the `semanticMappings` object.
