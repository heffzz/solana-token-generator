const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./logger');
const config = require('./config');

class BackupManager {
  constructor() {
    this.backupDir = './backups';
    this.dataDir = './data';
    this.logsDir = './logs';
    this.reportsDir = './reports';
  }

  // Inizializza il sistema di backup
  async initialize() {
    try {
      await fs.ensureDir(this.backupDir);
      await logger.info('Backup system initialized');
      return true;
    } catch (error) {
      await logger.error('Failed to initialize backup system', error);
      return false;
    }
  }

  // Crea un backup completo del sistema
  async createFullBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `lunacoin-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      await fs.ensureDir(backupPath);
      
      // Backup configurazione
      await this.backupConfiguration(backupPath);
      
      // Backup dati
      await this.backupData(backupPath);
      
      // Backup logs
      await this.backupLogs(backupPath);
      
      // Backup reports
      await this.backupReports(backupPath);
      
      // Backup keypair (se esiste)
      await this.backupKeypair(backupPath);
      
      // Crea manifest del backup
      await this.createBackupManifest(backupPath, {
        timestamp: new Date().toISOString(),
        type: 'full',
        version: '1.0.0',
        files: await this.getBackupFileList(backupPath)
      });
      
      // Comprimi backup
      const archivePath = await this.compressBackup(backupPath);
      
      // Rimuovi directory temporanea
      await fs.remove(backupPath);
      
      await logger.info('Full backup created successfully', {
        backupName,
        archivePath,
        size: (await fs.stat(archivePath)).size
      });
      
      return {
        success: true,
        backupName,
        archivePath,
        timestamp
      };
      
    } catch (error) {
      await logger.error('Failed to create full backup', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Backup della configurazione
  async backupConfiguration(backupPath) {
    const configPath = path.join(backupPath, 'config');
    await fs.ensureDir(configPath);
    
    // Backup file di configurazione
    const configFiles = [
      'config.js',
      'package.json',
      '.env.example',
      'README.md'
    ];
    
    for (const file of configFiles) {
      if (await fs.pathExists(file)) {
        await fs.copy(file, path.join(configPath, file));
      }
    }
    
    // Backup .env se esiste (senza dati sensibili)
    if (await fs.pathExists('.env')) {
      const envContent = await fs.readFile('.env', 'utf8');
      const sanitizedEnv = this.sanitizeEnvFile(envContent);
      await fs.writeFile(path.join(configPath, '.env.backup'), sanitizedEnv);
    }
  }

  // Backup dei dati
  async backupData(backupPath) {
    if (await fs.pathExists(this.dataDir)) {
      await fs.copy(this.dataDir, path.join(backupPath, 'data'));
    }
  }

  // Backup dei logs
  async backupLogs(backupPath) {
    if (await fs.pathExists(this.logsDir)) {
      await fs.copy(this.logsDir, path.join(backupPath, 'logs'));
    }
  }

  // Backup dei report
  async backupReports(backupPath) {
    if (await fs.pathExists(this.reportsDir)) {
      await fs.copy(this.reportsDir, path.join(backupPath, 'reports'));
    }
  }

  // Backup del keypair (con crittografia)
  async backupKeypair(backupPath) {
    const keypairFiles = ['keypair.json', 'solana_keypair.json'];
    
    for (const file of keypairFiles) {
      if (await fs.pathExists(file)) {
        // Leggi keypair
        const keypairData = await fs.readJson(file);
        
        // Cripta i dati sensibili
        const encryptedData = this.encryptSensitiveData(keypairData);
        
        // Salva keypair crittografato
        await fs.writeJson(
          path.join(backupPath, `${file}.encrypted`),
          encryptedData,
          { spaces: 2 }
        );
        
        // Crea anche un hash per verifica integrità
        const hash = this.createDataHash(keypairData);
        await fs.writeFile(
          path.join(backupPath, `${file}.hash`),
          hash
        );
      }
    }
  }

  // Crea manifest del backup
  async createBackupManifest(backupPath, manifest) {
    await fs.writeJson(
      path.join(backupPath, 'manifest.json'),
      manifest,
      { spaces: 2 }
    );
  }

  // Ottieni lista file nel backup
  async getBackupFileList(backupPath) {
    const files = [];
    
    const walkDir = async (dir, basePath = '') => {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await walkDir(fullPath, relativePath);
        } else {
          files.push({
            path: relativePath,
            size: stat.size,
            modified: stat.mtime.toISOString()
          });
        }
      }
    };
    
    await walkDir(backupPath);
    return files;
  }

  // Comprimi backup
  async compressBackup(backupPath) {
    try {
      const archiveName = `${path.basename(backupPath)}.tar.gz`;
      const archivePath = path.join(this.backupDir, archiveName);
      
      // Usa tar per comprimere (disponibile su Windows con WSL o Git Bash)
      execSync(`tar -czf "${archivePath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`);
      
      return archivePath;
    } catch (error) {
      // Fallback: copia directory senza compressione
      const fallbackPath = `${backupPath}.backup`;
      await fs.copy(backupPath, fallbackPath);
      return fallbackPath;
    }
  }

  // Ripristina backup
  async restoreBackup(backupPath) {
    try {
      // Verifica che il backup esista
      if (!(await fs.pathExists(backupPath))) {
        throw new Error('Backup file not found');
      }
      
      // Crea backup di sicurezza dello stato corrente
      const currentBackup = await this.createFullBackup();
      
      // Estrai backup
      const extractPath = await this.extractBackup(backupPath);
      
      // Verifica manifest
      const manifest = await this.verifyBackupManifest(extractPath);
      
      if (!manifest.valid) {
        throw new Error('Invalid backup manifest');
      }
      
      // Ripristina file
      await this.restoreFiles(extractPath);
      
      // Pulisci file temporanei
      await fs.remove(extractPath);
      
      await logger.info('Backup restored successfully', {
        backupPath,
        currentBackup: currentBackup.archivePath
      });
      
      return {
        success: true,
        currentBackup: currentBackup.archivePath
      };
      
    } catch (error) {
      await logger.error('Failed to restore backup', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Estrai backup
  async extractBackup(backupPath) {
    const extractPath = path.join(this.backupDir, 'temp_restore');
    await fs.ensureDir(extractPath);
    
    try {
      // Prova a estrarre con tar
      execSync(`tar -xzf "${backupPath}" -C "${extractPath}"`);
    } catch (error) {
      // Fallback: assume che sia già una directory
      await fs.copy(backupPath, extractPath);
    }
    
    return extractPath;
  }

  // Verifica manifest del backup
  async verifyBackupManifest(extractPath) {
    try {
      const manifestPath = path.join(extractPath, 'manifest.json');
      
      if (!(await fs.pathExists(manifestPath))) {
        return { valid: false, error: 'Manifest not found' };
      }
      
      const manifest = await fs.readJson(manifestPath);
      
      // Verifica struttura manifest
      const requiredFields = ['timestamp', 'type', 'version', 'files'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          return { valid: false, error: `Missing field: ${field}` };
        }
      }
      
      // Verifica file
      for (const file of manifest.files) {
        const filePath = path.join(extractPath, file.path);
        if (!(await fs.pathExists(filePath))) {
          return { valid: false, error: `Missing file: ${file.path}` };
        }
      }
      
      return { valid: true, manifest };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Ripristina file dal backup
  async restoreFiles(extractPath) {
    const backupDirs = ['data', 'logs', 'reports', 'config'];
    
    for (const dir of backupDirs) {
      const sourcePath = path.join(extractPath, dir);
      
      if (await fs.pathExists(sourcePath)) {
        const targetPath = dir === 'config' ? '.' : `./${dir}`;
        
        // Backup esistente prima di sovrascrivere
        if (await fs.pathExists(targetPath)) {
          const backupTarget = `${targetPath}.pre-restore`;
          await fs.move(targetPath, backupTarget);
        }
        
        await fs.copy(sourcePath, targetPath);
      }
    }
  }

  // Pulisci backup vecchi
  async cleanOldBackups(retentionDays = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const backups = await fs.readdir(this.backupDir);
      let deletedCount = 0;
      
      for (const backup of backups) {
        const backupPath = path.join(this.backupDir, backup);
        const stat = await fs.stat(backupPath);
        
        if (stat.mtime < cutoffDate) {
          await fs.remove(backupPath);
          deletedCount++;
        }
      }
      
      await logger.info('Old backups cleaned', {
        deletedCount,
        retentionDays
      });
      
      return { deletedCount };
      
    } catch (error) {
      await logger.error('Failed to clean old backups', error);
      return { error: error.message };
    }
  }

  // Lista backup disponibili
  async listBackups() {
    try {
      if (!(await fs.pathExists(this.backupDir))) {
        return [];
      }
      
      const backups = await fs.readdir(this.backupDir);
      const backupList = [];
      
      for (const backup of backups) {
        const backupPath = path.join(this.backupDir, backup);
        const stat = await fs.stat(backupPath);
        
        backupList.push({
          name: backup,
          path: backupPath,
          size: stat.size,
          created: stat.birthtime.toISOString(),
          modified: stat.mtime.toISOString()
        });
      }
      
      // Ordina per data di creazione (più recenti prima)
      backupList.sort((a, b) => new Date(b.created) - new Date(a.created));
      
      return backupList;
      
    } catch (error) {
      await logger.error('Failed to list backups', error);
      return [];
    }
  }

  // Sanitizza file .env rimuovendo dati sensibili
  sanitizeEnvFile(content) {
    const lines = content.split('\n');
    const sensitiveKeys = [
      'WALLET_PRIVATE_KEY',
      'API_KEY',
      'SECRET',
      'TOKEN',
      'PASSWORD',
      'PASS'
    ];
    
    return lines.map(line => {
      const [key] = line.split('=');
      
      if (sensitiveKeys.some(sensitive => key?.includes(sensitive))) {
        return `${key}=***REDACTED***`;
      }
      
      return line;
    }).join('\n');
  }

  // Cripta dati sensibili (implementazione semplice)
  encryptSensitiveData(data) {
    // In produzione, usare una libreria di crittografia robusta
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('lunacoin-backup-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm
    };
  }

  // Crea hash per verifica integrità
  createDataHash(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Programma backup automatici
  async scheduleAutomaticBackups() {
    const cron = require('node-cron');
    
    // Backup giornaliero alle 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      await logger.info('Starting scheduled backup');
      const result = await this.createFullBackup();
      
      if (result.success) {
        await logger.info('Scheduled backup completed successfully');
        
        // Pulisci backup vecchi
        await this.cleanOldBackups(config.backup?.retentionDays || 7);
      } else {
        await logger.error('Scheduled backup failed', result.error);
      }
    });
    
    await logger.info('Automatic backup scheduling enabled');
  }
}

module.exports = BackupManager;