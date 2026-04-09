# GEMINI.md - camp-app

## Project Overview
**camp-app** is a comprehensive Summer Camp Management application built with **Expo**, **React Native**, and **Firebase**. It leverages the **BNA UI** component library for a polished, cross-platform user experience.

The application is designed for camp staff to manage camper registrations, track attendance via QR code scanning, and handle "Camp Store" credits/transactions in real-time.

### Main Technologies
- **Framework:** [Expo](https://expo.dev/) (SDK 54+) with [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation).
- **Language:** [TypeScript](https://www.typescriptlang.org/).
- **Backend/Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) for real-time data synchronization.
- **UI Library:** **BNA UI** (located in `components/ui/`), featuring highly customizable and animated components.
- **State Management:** React Context API (e.g., `SearchProvider`) and Firebase real-time listeners (`onSnapshot`).
- **Icons:** [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native).
- **Animations:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/).

## Architecture & Structure
- `app/`: Contains the Expo Router file-based navigation structure.
  - `(tabs)/`: Main navigation hub (Home, Search, Settings).
  - `camper/`: Dynamic routes for camper profiles (`[id].tsx`), registration, and lists.
  - `scanner.tsx`: QR/Barcode scanning interface.
- `components/ui/`: Atomic UI components (Button, Card, Input, Text, View, etc.) following a consistent design system.
- `lib/firebase.ts`: Centralized Firebase configuration and Firestore collection references (`campers`, `attendance`, `transactions`).
- `theme/`: Theming logic including `colors.ts` (light/dark modes) and `theme-provider.tsx`.
- `hooks/`: Specialized hooks like `useColor.ts` for theme-aware styling and `useColorScheme.ts`.
- `providers/`: Global context providers like `SearchProvider`.

## Key Features
1. **Camper Registration:** Dynamic registration flow when a new QR code is scanned.
2. **Attendance Tracking:** Quick check-in via QR code scanning or manual profile updates.
3. **Credit Management:** Real-time balance updates and transaction history for camp store purchases.
4. **Scanner Integration:** Integrated camera/barcode scanner for rapid camper identification.
5. **Theme Support:** Native light and dark mode support with seamless transitions.

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Start the Expo development server
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web
```

### Testing & Linting
```bash
# Run ESLint
npm run lint
```

## Development Conventions

### Styling
- **Theme-Aware:** Always use the `useColor` hook or `Colors` constant from `@/theme/colors` to ensure components support both light and dark modes.
- **UI Components:** Prefer using components from `@/components/ui/` (e.g., `<View>`, `<Text>`, `<Button>`) instead of standard React Native primitives to maintain design consistency.
- **Layouts:** Use `Gap` and `Padding` values from `theme/globals.ts` where applicable.

### Firebase Usage
- Collection references are exported from `lib/firebase.ts`. Use these instead of manual collection strings.
- Prefer `onSnapshot` for data that needs real-time updates (like camper balances).

### Routing
- Use `expo-router`'s `useLocalSearchParams` for dynamic route parameters.
- Navigation should primarily use the `router` object from `useRouter`.

### Components
- When adding new UI components, follow the pattern in `components/ui/button.tsx` (using `forwardRef` and supporting both `animation` and `haptic` props).
