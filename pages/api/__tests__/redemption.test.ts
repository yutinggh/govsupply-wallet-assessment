import handler from '../redemption';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';

// Mock MongoDB connection function
jest.mock('../../../lib/mongodb', () => ({
  connectToDatabase: jest.fn(),
}));

const createMocks = ({
  method = 'POST',
  body = {},
}: {
  method?: string;
  body?: any;
} = {}) => {
  const req = ({ method, body } as unknown) as NextApiRequest;
  const res = {
    status: jest.fn().mockReturnThis(), // Mock for response status method
    json: jest.fn().mockReturnThis(), // Mock for response json method
  } as unknown as NextApiResponse;
  return { req, res };
};

// Test suite for Redemption API
describe('Redemption API', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock function calls before each test
  });

  it('should return 200 and redeem the gift successfully', async () => {
    const { req, res } = createMocks({ body: { staff_pass_id: 'valid_id', team_name: 'mock_team' } });

    const mockDb = { collection: jest.fn() };
    (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });

    // Mock behavior for checking staff pass ID
    mockDb.collection.mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue({ staff_pass_id: 'valid_id' }) });

    // Mock behavior for checking if the relevant team name is redeemed (not found initially)
    mockDb.collection.mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue(null) });

    // Mock behavior for inserting into redeemed collection
    const insertOneMock = jest.fn();
    mockDb.collection.mockReturnValueOnce({ insertOne: insertOneMock });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
});

  it('should return 405 if HTTP method is not POST', async () => {
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
  });

  it('should return 400 if staff pass ID is invalid', async () => {
    const { req, res } = createMocks({ body: { staff_pass_id: 'invalid_id' } });

    // Mock behavior for MongoDB to return null for invalid staff pass ID
    (connectToDatabase as jest.Mock).mockResolvedValue({ db: { collection: jest.fn().mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) }) } });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid staff pass ID' });
  });

  it('should return 400 if team has already redeemed the gift', async () => {
    const { req, res } = createMocks({ body: { staff_pass_id: 'valid_id' } });

    const mockDb = { collection: jest.fn() };
    (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });
    mockDb.collection.mockReturnValue({ findOne: jest.fn().mockResolvedValue({ team_name: 'mock_team' }) });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'mock_team team has already redeemed the gift' });
  });

  it('should return 500 if an internal server error occurs', async () => {
    const { req, res } = createMocks({ body: { staff_pass_id: 'valid_id' } });

    (connectToDatabase as jest.Mock).mockRejectedValue(new Error('Mock database error'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
