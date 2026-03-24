import { IUserDocument } from '../../models/User';
import { File } from 'multer';

declare global {
  namespace Express {
    export interface Request {
      user?: IUserDocument;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}