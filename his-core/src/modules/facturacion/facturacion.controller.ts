import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FacturacionService } from './facturacion.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { CreateCuentaItemDto } from './dto/create-cuenta-item.dto';
import { UpdateCuentaItemDto } from './dto/update-cuenta-item.dto';
import { FacturarCuentaDto } from './dto/facturar-cuenta.dto';

@Controller('facturacion')
@UseGuards(JwtAuthGuard)
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  @Get('resumen')
  async resumen() {
    return this.facturacionService.getResumen();
  }

  @Get('cargos')
  async buscarCargos(@Query('search') search?: string) {
    return this.facturacionService.buscarCargos(search);
  }

  @Get('ingresos')
  async listarIngresos(@Query('search') search?: string, @Query('estado') estado?: string) {
    return this.facturacionService.listarIngresos(search, estado);
  }

  @Get('ingresos/:id')
  async obtenerIngreso(@Param('id') id: string) {
    return this.facturacionService.obtenerIngresoPorId(id);
  }

  @Post('ingresos')
  @HttpCode(HttpStatus.CREATED)
  async crearIngreso(@Body() dto: CreateIngresoDto) {
    return this.facturacionService.crearIngreso(dto);
  }

  @Get('cuentas/:id')
  async obtenerCuenta(@Param('id') id: string) {
    return this.facturacionService.obtenerCuentaPorId(id);
  }

  @Post('cuentas/:id/items')
  @HttpCode(HttpStatus.CREATED)
  async agregarItem(@Param('id') id: string, @Body() dto: CreateCuentaItemDto) {
    return this.facturacionService.agregarCuentaItem(id, dto);
  }

  @Put('cuentas/:id/items/:itemId')
  async actualizarItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCuentaItemDto,
  ) {
    return this.facturacionService.actualizarCuentaItem(id, itemId, dto);
  }

  @Delete('cuentas/:id/items/:itemId')
  async eliminarItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.facturacionService.eliminarCuentaItem(id, itemId);
  }

  @Get('cuentas/:id/validar-rips')
  async validarRips(@Param('id') id: string) {
    return this.facturacionService.validarRips(id);
  }

  @Post('cuentas/:id/facturar')
  @HttpCode(HttpStatus.CREATED)
  async facturarCuenta(@Param('id') id: string, @Body() dto: FacturarCuentaDto) {
    return this.facturacionService.facturarCuenta(id, dto);
  }

  @Get('facturas')
  async listarFacturas(@Query('search') search?: string, @Query('estado') estado?: string) {
    return this.facturacionService.listarFacturas(search, estado);
  }

  @Get('facturas/:id')
  async obtenerFactura(@Param('id') id: string) {
    return this.facturacionService.obtenerFacturaPorId(id);
  }

  @Post('facturas/:id/anular')
  async anularFactura(@Param('id') id: string) {
    return this.facturacionService.anularFactura(id);
  }
}
