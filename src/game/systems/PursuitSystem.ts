export class PursuitSystem
{
    private active = false;

    isActive ()
    {
        return this.active;
    }

    start ()
    {
        this.active = true;
    }

    stop ()
    {
        this.active = false;
    }
}
