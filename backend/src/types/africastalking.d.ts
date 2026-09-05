declare module 'africastalking' {
  interface AtSmsSendOptions {
    to: string[];
    message: string;
    from?: string;
    [key: string]: unknown;
  }

  interface AtSms {
    send(options: AtSmsSendOptions): Promise<unknown>;
  }

  function africastalking(options: { username: string; apiKey: string }): {
    SMS: AtSms;
    [key: string]: unknown;
  };

  export default africastalking;
}
