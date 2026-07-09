import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { LocalizedText } from '../../common/types/localized-text.type';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb' })
  title: LocalizedText;

  @Column('text', { array: true, default: [] })
  images: string[];

  @Column({ default: 0 })
  sortOrder: number;
}
