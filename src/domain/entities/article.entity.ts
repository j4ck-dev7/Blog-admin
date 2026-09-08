import { ObjectId } from 'mongodb';

export interface Content {
  type: 'paragraph' | 'image';
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
}

export interface Article {
  _id?: ObjectId;
  title?: string;
  slug?: string;
  creationDate?: Date;
  author?: string;
  content?: Content[];
  banner?: string;
  viewsCount?: number;
  likeCount?: number;
  commentCount?: number;
}
