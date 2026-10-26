import { withImageReferences } from './references';

const a = { file_id: 'image-a' };
const b = { file_id: 'image-b' };

function setup(files = [a], loaded = [b]) {
  const loadFiles = jest.fn().mockResolvedValue(loaded);
  const execute = jest.fn().mockResolvedValue('image-result');
  const onError = jest.fn().mockReturnValue('reference-error');
  return { files, loadFiles, execute, onError };
}

describe('withImageReferences', () => {
  it('uses admitted current images without a lookup', async () => {
    const options = setup();
    expect(await withImageReferences({ ...options, imageIds: ['image-a'] })).toBe('image-result');
    expect(options.loadFiles).not.toHaveBeenCalled();
    expect(options.execute).toHaveBeenCalledWith([a]);
  });

  it('loads missing references once and preserves requested order and duplicates', async () => {
    const options = setup();
    await withImageReferences({ ...options, imageIds: ['image-b', 'image-a', 'image-b'] });
    expect(options.loadFiles).toHaveBeenCalledWith(['image-b']);
    expect(options.execute).toHaveBeenCalledWith([b, a, b]);
  });

  it.each([{ imageIds: [] }, { imageIds: ['filename.png'] }, { imageIds: ['image-a', 'missing'] }])(
    'does not read streams or send a partial edit for invalid IDs %j',
    async ({ imageIds }) => {
      const options = setup();
      expect(await withImageReferences({ ...options, imageIds })).toBe('reference-error');
      expect(options.execute).not.toHaveBeenCalled();
    },
  );

  it('ignores extra records returned by the owner-scoped loader', async () => {
    const options = setup([], [b]);
    await withImageReferences({ ...options, imageIds: ['missing'] });
    expect(options.execute).not.toHaveBeenCalled();
  });

  it('does not hide database failures as a missing image', async () => {
    const options = setup();
    options.loadFiles.mockRejectedValue(new Error('database unavailable'));
    await expect(withImageReferences({ ...options, imageIds: ['image-b'] })).rejects.toThrow(
      'database unavailable',
    );
    expect(options.onError).not.toHaveBeenCalled();
    expect(options.execute).not.toHaveBeenCalled();
  });
});
