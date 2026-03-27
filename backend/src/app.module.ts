import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { EquiposModule } from './modules/equipos/equipos.module';
import { SearchModule } from './modules/search/search.module';
import { SlaContractsModule } from './modules/sla-contracts/sla-contracts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = configService.get<TypeOrmModuleOptions>('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),
    AuthModule,
    UsersModule,
    BranchesModule,
    ClientesModule,
    EquiposModule,
    SearchModule,
    SlaContractsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
