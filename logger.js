import fs from 'fs';
import path from 'path';

export class Logger {
    constructor(logDir = './logs') {
        this.logDir = logDir;
        this.logFile = path.join(logDir, `token-generator-${this.getDateString()}.log`);
        this.errorFile = path.join(logDir, `errors-${this.getDateString()}.log`);
        this.operationsFile = path.join(logDir, `operations-${this.getDateString()}.log`);
        
        this.ensureLogDirectory();
        this.initializeLogFiles();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    initializeLogFiles() {
        const timestamp = this.getTimestamp();
        const initMessage = `=== Token Generator Log Started at ${timestamp} ===\n`;
        
        this.writeToFile(this.logFile, initMessage);
        this.writeToFile(this.operationsFile, initMessage);
    }

    log(message, level = 'INFO') {
        const logEntry = this.formatLogEntry(message, level);
        
        // Scrivi su console
        console.log(logEntry);
        
        // Scrivi su file
        this.writeToFile(this.logFile, logEntry + '\n');
        
        // Se è un'operazione importante, scrivi anche nel file operazioni
        if (level === 'OPERATION' || level === 'SUCCESS') {
            this.writeToFile(this.operationsFile, logEntry + '\n');
        }
    }

    error(message, error = null) {
        const errorEntry = this.formatLogEntry(message, 'ERROR');
        
        // Scrivi su console
        console.error(errorEntry);
        
        // Scrivi su file principale
        this.writeToFile(this.logFile, errorEntry + '\n');
        
        // Scrivi su file errori
        let errorDetails = errorEntry + '\n';
        if (error) {
            errorDetails += `Stack Trace: ${error.stack || error.toString()}\n`;
        }
        errorDetails += '---\n';
        
        this.writeToFile(this.errorFile, errorDetails);
    }

    operation(message, data = null) {
        const operationEntry = this.formatLogEntry(message, 'OPERATION');
        
        console.log(`🔄 ${operationEntry}`);
        
        let logEntry = operationEntry + '\n';
        if (data) {
            logEntry += `Data: ${JSON.stringify(data, null, 2)}\n`;
        }
        logEntry += '---\n';
        
        this.writeToFile(this.logFile, logEntry);
        this.writeToFile(this.operationsFile, logEntry);
    }

    success(message, data = null) {
        const successEntry = this.formatLogEntry(message, 'SUCCESS');
        
        console.log(`✅ ${successEntry}`);
        
        let logEntry = successEntry + '\n';
        if (data) {
            logEntry += `Result: ${JSON.stringify(data, null, 2)}\n`;
        }
        logEntry += '---\n';
        
        this.writeToFile(this.logFile, logEntry);
        this.writeToFile(this.operationsFile, logEntry);
    }

    warning(message) {
        const warningEntry = this.formatLogEntry(message, 'WARNING');
        
        console.warn(`⚠️  ${warningEntry}`);
        
        this.writeToFile(this.logFile, warningEntry + '\n');
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const debugEntry = this.formatLogEntry(message, 'DEBUG');
            
            console.log(`🐛 ${debugEntry}`);
            
            let logEntry = debugEntry + '\n';
            if (data) {
                logEntry += `Debug Data: ${JSON.stringify(data, null, 2)}\n`;
            }
            
            this.writeToFile(this.logFile, logEntry);
        }
    }

    formatLogEntry(message, level) {
        const timestamp = this.getTimestamp();
        return `[${timestamp}] [${level.padEnd(9)}] ${message}`;
    }

    writeToFile(filePath, content) {
        try {
            fs.appendFileSync(filePath, content, 'utf8');
        } catch (error) {
            console.error(`Errore scrittura log: ${error.message}`);
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    getDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Metodi per logging specifico del sistema
    logTokenCreation(tokenData) {
        this.operation('Token Creation Started', {
            name: tokenData.name,
            symbol: tokenData.symbol,
            supply: tokenData.supply,
            decimals: tokenData.decimals
        });
    }

    logTokenCreated(token) {
        this.success('Token Created Successfully', {
            name: token.name,
            symbol: token.symbol,
            mint: token.mint,
            supply: token.supply
        });
    }

    logValidationResult(name, symbol, isUnique) {
        const message = `Validation: ${name} (${symbol}) - ${isUnique ? 'UNIQUE' : 'DUPLICATE'}`;
        this.log(message, isUnique ? 'SUCCESS' : 'WARNING');
    }

    logDEXListing(tokenName, dex, success, data = null) {
        const message = `DEX Listing: ${tokenName} on ${dex} - ${success ? 'SUCCESS' : 'FAILED'}`;
        
        if (success) {
            this.success(message, data);
        } else {
            this.error(message, data);
        }
    }

    logBugFix(issue, solution) {
        this.operation('Auto Bug Fix Applied', {
            issue: issue,
            solution: solution,
            timestamp: this.getTimestamp()
        });
    }

    logMonitoringCheck(results) {
        this.log('Monitoring Check Completed', 'INFO');
        this.debug('Monitoring Results', results);
    }

    // Metodi per statistiche e report
    generateDailyReport() {
        const reportFile = path.join(this.logDir, `daily-report-${this.getDateString()}.json`);
        
        try {
            const stats = this.analyzeLogs();
            const report = {
                date: this.getDateString(),
                timestamp: this.getTimestamp(),
                statistics: stats,
                summary: this.generateSummary(stats)
            };
            
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            this.success('Daily Report Generated', { file: reportFile });
            
            return report;
        } catch (error) {
            this.error('Failed to generate daily report', error);
            return null;
        }
    }

    analyzeLogs() {
        try {
            const logContent = fs.readFileSync(this.logFile, 'utf8');
            const lines = logContent.split('\n').filter(line => line.trim());
            
            const stats = {
                totalEntries: lines.length,
                errorCount: 0,
                successCount: 0,
                warningCount: 0,
                operationCount: 0,
                tokensCreated: 0,
                dexListings: 0,
                bugsFixes: 0
            };
            
            lines.forEach(line => {
                if (line.includes('[ERROR]')) stats.errorCount++;
                if (line.includes('[SUCCESS]')) stats.successCount++;
                if (line.includes('[WARNING]')) stats.warningCount++;
                if (line.includes('[OPERATION]')) stats.operationCount++;
                if (line.includes('Token Created Successfully')) stats.tokensCreated++;
                if (line.includes('DEX Listing') && line.includes('SUCCESS')) stats.dexListings++;
                if (line.includes('Auto Bug Fix Applied')) stats.bugsFixes++;
            });
            
            return stats;
        } catch (error) {
            this.error('Failed to analyze logs', error);
            return {};
        }
    }

    generateSummary(stats) {
        return {
            performance: {
                successRate: stats.successCount / (stats.successCount + stats.errorCount) * 100,
                errorRate: stats.errorCount / stats.totalEntries * 100
            },
            productivity: {
                tokensPerHour: stats.tokensCreated, // Semplificato
                listingsPerToken: stats.dexListings / Math.max(stats.tokensCreated, 1)
            },
            reliability: {
                autoFixesApplied: stats.bugsFixes,
                warningsGenerated: stats.warningCount
            }
        };
    }

    // Cleanup vecchi log
    cleanupOldLogs(daysToKeep = 7) {
        try {
            const files = fs.readdirSync(this.logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            let deletedCount = 0;
            
            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            });
            
            if (deletedCount > 0) {
                this.log(`Cleaned up ${deletedCount} old log files`);
            }
        } catch (error) {
            this.error('Failed to cleanup old logs', error);
        }
    }

    // Esporta logs per analisi esterna
    exportLogs(format = 'json') {
        const exportFile = path.join(this.logDir, `export-${this.getDateString()}.${format}`);
        
        try {
            if (format === 'json') {
                const report = this.generateDailyReport();
                fs.writeFileSync(exportFile, JSON.stringify(report, null, 2));
            } else if (format === 'csv') {
                // Implementa esportazione CSV se necessario
                this.log('CSV export not implemented yet');
            }
            
            this.success('Logs exported', { file: exportFile, format });
            return exportFile;
        } catch (error) {
            this.error('Failed to export logs', error);
            return null;
        }
    }
}