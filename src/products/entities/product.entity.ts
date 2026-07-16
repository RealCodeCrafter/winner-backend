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
  description: LocalizedText | null;

  @Column('text', { array: true, default: [] })
  volumes: string[];

  @Column('text', { array: true, default: [] })
  images: string[];

  @Column('text', { array: true, nullable: true })
  viscosityClass: string[] | null;

  @Column('text', { array: true, nullable: true })
  densityAt15C: string[] | null;

  @Column('text', { array: true, nullable: true })
  kinematicViscosityAt40C: string[] | null;

  @Column('text', { array: true, nullable: true })
  kinematicViscosityAt100C: string[] | null;

  @Column('text', { array: true, nullable: true })
  viscosityIndex: string[] | null;

  @Column('text', { array: true, nullable: true })
  flashPoint: string[] | null;

  @Column('text', { array: true, nullable: true })
  pourPoint: string[] | null;

  @Column('text', { array: true, nullable: true })
  baseNumber: string[] | null;

  @Column('text', { array: true, nullable: true })
  specifications: string[] | null;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ default: 0 })
  sortOrder: number;
}
