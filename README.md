# Trade Backtesting Tracker

A React-based application for tracking and analyzing trading decisions with Take Profit (TP) and Stop Loss (SL) values. Perfect for backtesting trading strategies and evaluating decision-making performance.

## Features

- **Trade Tracking**: Record trading decisions (Yes/No) with TP and SL values
- **Persistent Storage**: All data saved to localStorage - survives page refreshes
- **Statistics Dashboard**: Real-time analytics including:
  - Total trades count
  - Win/loss breakdown
  - Total net profit/loss
  - Win rate percentage
  - Average net per trade
- **CSV Export**: Download your trading history for further analysis
- **Real-time Updates**: Instant calculation of results based on decisions
  - **Yes** = Trade hit TP (profit: +TP)
  - **No** = Trade hit SL (loss: -SL)

## How It Works

1. Enter your **TP (Take Profit)** and **SL (Stop Loss)** values
2. Click **Yes** if the trade would have hit TP, or **No** if it would have hit SL
3. View your performance statistics in real-time
4. Export your data to CSV for detailed analysis
5. Clear all data when starting a new backtesting session

## Tech Stack

- **React** with TypeScript
- **Vite** for fast development
- **Framer Motion** for smooth animations
- **Tailwind CSS** for styling
- **localStorage** for data persistence

## Setup

### Prerequisites
- Node.js (v16 or higher)
- pnpm package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd trade-tracker
```

2. Install dependencies
```bash
pnpm install
```

3. Start the development server
```bash
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```
