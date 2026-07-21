import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  submit(@Body() dto: CreateContactDto) {
    void this.contactService.sendEmailAsync(dto);

    return {
      success: true,
      message: 'Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время!',
    };
  }
}
