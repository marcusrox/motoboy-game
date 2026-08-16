export interface ProgressRecords
{
    highScore: number;
    mostDeliveries: number;
    mostMoney: number;
}

export interface RecordUpdate
{
    records: ProgressRecords;
    newHighScore: boolean;
    newDeliveryRecord: boolean;
    newMoneyRecord: boolean;
}

const STORAGE_KEY = 'motoboy-brasil:progress-records:v1';
const EMPTY_RECORDS: ProgressRecords = {
    highScore: 0,
    mostDeliveries: 0,
    mostMoney: 0
};

export class ProgressPersistence
{
    load (): ProgressRecords
    {
        try
        {
            const stored = localStorage.getItem(STORAGE_KEY);

            if (!stored)
            {
                return { ...EMPTY_RECORDS };
            }

            const parsed = JSON.parse(stored) as Partial<ProgressRecords>;

            return {
                highScore: this.validNumber(parsed.highScore),
                mostDeliveries: this.validNumber(parsed.mostDeliveries),
                mostMoney: this.validNumber(parsed.mostMoney)
            };
        }
        catch
        {
            return { ...EMPTY_RECORDS };
        }
    }

    update (score: number, deliveries: number, money: number): RecordUpdate
    {
        const previous = this.load();
        const newHighScore = score > previous.highScore;
        const newDeliveryRecord = deliveries > previous.mostDeliveries;
        const newMoneyRecord = money > previous.mostMoney;
        const records = {
            highScore: Math.max(previous.highScore, score),
            mostDeliveries: Math.max(previous.mostDeliveries, deliveries),
            mostMoney: Math.max(previous.mostMoney, money)
        };

        try
        {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        }
        catch
        {
            // O jogo continua normalmente quando o navegador bloqueia armazenamento local.
        }

        return { records, newHighScore, newDeliveryRecord, newMoneyRecord };
    }

    private validNumber (value: unknown)
    {
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
    }
}
