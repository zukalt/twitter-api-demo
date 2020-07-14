import { Column, Entity, Index, ObjectID, ObjectIdColumn } from 'typeorm';
import { Tweet } from '../model/interfaces';
const COLLECTION = 'tweets';

@Entity({name: COLLECTION})
export class TweetEntity implements Tweet {
  static COLLECTION = COLLECTION;

  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  @Index({unique: false})
  createdAt: number;

  @Column()
  text: string;

}
