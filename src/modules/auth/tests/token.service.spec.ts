import { TokenService } from '../token.service';
import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';

describe('TokenService', () => {
  let service: TokenService;
  let mockConfig: any;
  let mockRedis: any;

  beforeEach(() => {
    mockConfig = { get: jest.fn((key: string) => 'test_secret') };
    mockRedis = {
      setEx: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
    };

    mockRedis.setEx.mockImplementation(() => Promise.resolve('OK'));
    mockRedis.get.mockImplementation(() => Promise.resolve(null));
    mockRedis.del.mockImplementation(() => Promise.resolve(1));

    service = new TokenService(mockConfig as any, mockRedis as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generatePair should return tokens and store jti in redis', async () => {
    const pair = await service.generatePair('user-1', 'admin');

    expect(pair).toHaveProperty('accessToken');
    expect(pair).toHaveProperty('refreshToken');
    expect(pair).toHaveProperty('jti');
    expect(mockRedis.setEx).toHaveBeenCalledWith(`refresh:${pair.jti}`, 7 * 24 * 60 * 60, 'user-1');
  });

  it('validateRefreshToken should return payload when token valid and jti exists', async () => {
    mockRedis.get.mockImplementation(() => Promise.resolve('user-1'));

    const pair = await service.generatePair('user-1', 'user');
    const validated = await service.validateRefreshToken(pair.refreshToken);

    expect(validated).toMatchObject({ userId: 'user-1', jti: pair.jti });
  });

  it('revokeRefreshByJti should call redis.del', async () => {
    await service.revokeRefreshByJti('some-jti');
    expect(mockRedis.del).toHaveBeenCalledWith('refresh:some-jti');
  });
});
