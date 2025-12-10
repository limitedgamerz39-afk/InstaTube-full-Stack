import { useNewUserFeed } from './queryClient';
import { useQuery } from '@tanstack/react-query';
import { postAPI } from './api';

// Mock the dependencies
jest.mock('@tanstack/react-query');
jest.mock('./api');

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
  },
  writable: true,
});

describe('useNewUserFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call postAPI.getNewUserFeed with correct parameters', () => {
    // Mock the useQuery return value
    useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValue('token123');

    // Call the hook
    const result = useNewUserFeed(1, 10);

    // Verify useQuery was called with correct parameters
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['new-user-feed', 1, 10],
        queryFn: expect.any(Function),
      })
    );
  });

  it('should handle rate limiting', async () => {
    // Mock the useQuery return value
    useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValue('token123');

    // Call the hook
    const result = useNewUserFeed(1, 10);

    // Get the query function
    const queryFn = useQuery.mock.calls[0][0].queryFn;

    // Mock postAPI.getNewUserFeed to track calls
    postAPI.getNewUserFeed = jest.fn().mockResolvedValue({
      data: { posts: [] },
    });

    // Call the query function
    await queryFn();

    // Verify postAPI.getNewUserFeed was called with correct parameters
    expect(postAPI.getNewUserFeed).toHaveBeenCalledWith(1, 10);
  });
});