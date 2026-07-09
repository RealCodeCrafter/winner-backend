import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { LocalizedText } from '../../common/types/localized-text.type';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb' })
  name: LocalizedText;

  @Column({ type: 'jsonb', nullable: true })
  tag: LocalizedText | null;

  @Column({ type: 'jsonb', nullable: true })
  description: LocalizedText | null;

  @Column('text', { array: true, default: [] })
  volumes: string[];

  @Column('text', { array: true, default: [] })
  images: string[];

  @Column({ nullable: true })
  viscosity: string;

  @Column({ nullable: true })
  apiStandard: string;

  @Column({ nullable: true })
  aceaStandard: string;

  @Column({ type: 'jsonb', nullable: true })
  manufacturedIn: LocalizedText | null;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ default: 0 })
  sortOrder: number;
}
