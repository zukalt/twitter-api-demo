import { Column, Entity, ObjectIdColumn } from 'typeorm';

@Entity({name: 'topics'})
export class TopicsEntity {

  @ObjectIdColumn()
  _id: number;

  @Column()
  counts: { [key:string] : number };
}
