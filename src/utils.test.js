import { join } from 'path';
import { codify, findFolderPathBaseOnFile } from './utils.js';

describe('utils test', () => {
  describe('findFolderPathBaseOnFile function', () => {
    describe('looking up package.json', () => {
      it('should return Node.js project correctly when not nested', async () => {
        // Arrange
        const submissionPath = join(process.cwd(), 'submissions', 'approved', '1');

        // Action
        const projectPath = await findFolderPathBaseOnFile(submissionPath, 'package.json');

        // Assert
        expect(projectPath).toEqual(submissionPath);
      });

      it('should return Node.js project correctly when do nested', async () => {
        // Arrange
        const submissionPath = join(process.cwd(), 'submissions', 'approved', '2');

        // Action
        const projectPath = await findFolderPathBaseOnFile(submissionPath, 'package.json');

        // Assert
        expect(projectPath).toEqual(
          join(submissionPath, 'submission', 'percobaan-pertama'),
        );
      });

      it('should return null when Node.js project not found', async () => {
        // Arrange
        const submissionPath = join(process.cwd(), 'submissions', 'rejected', '3');

        // Action
        const projectPath = await findFolderPathBaseOnFile(submissionPath, 'package.json');

        // Assert
        expect(projectPath).toEqual(null);
      });
    });
  });

  describe('codify function', () => {
    it('should codify error correctly when given context value', async () => {
      const error = codify(new Error('ups'), 'UPS_ERROR', { id: 1 });

      expect(error.message).toEqual('ups');
      expect(error.code).toEqual('UPS_ERROR');
      expect(error.context.id).toEqual(1);
    });

    it('should codify error correctly when not given context value', async () => {
      const error = codify(new Error('ups'), 'UPS_ERROR');

      expect(error.message).toEqual('ups');
      expect(error.code).toEqual('UPS_ERROR');
      expect(error.context).toEqual({});
    });
  });
});
