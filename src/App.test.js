import { render, screen } from '@testing-library/react';
import AppWrapper from './AppWrapper';

jest.mock('./context/SolanaWalletContext', () => ({
  SolanaProvider: ({ children }) => children,
  useSolanaWallet: () => ({}),
}));

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    publicKey: null,
    connected: false,
    wallet: null,
    disconnect: jest.fn(),
  }),
}));

jest.mock('./context/GeoLocationContext', () => ({
  GeoLocationProvider: ({ children }) => children,
  useGeoLocation: () => ({
    countryCode: 'RO',
    country: 'Romania',
    ip: '127.0.0.1',
    isLoading: false,
  }),
}));

test('renders the app shell without the error boundary', () => {
  render(<AppWrapper />);
  expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
});
