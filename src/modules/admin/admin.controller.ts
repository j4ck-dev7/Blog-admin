import { Controller, Get } from '@nestjs/common';
import { adminService } from './admin.service';

@Controller('admin')
export class adminController {
    constructor(private readonly adminService: adminService){}

    @Get()
    findAll(){
        return this.adminService.findAll()
    }
}