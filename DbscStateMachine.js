/**
 * Device-Bound Session Credentials session mode state machine (transducer type)
 */
class DbscStateMachine {
  constructor() {
    /** @type {'inactive' | 'pending' | 'bound'} */ 
    this.state = 'inactive';
  }

  /**
   * @param {'auth' | 'register' | 'refresh' | 'invalid'} input.action  
   * @param {'present' | 'not-present'} input.session_id
   * @param {'present' | 'not-present'} input.device_bound_session_id
   * @param {'valid' | 'invalid' | 'not-present'} input.device_bound_proof 
   * @returns {'send-registration-info' | 'send-config' | 'send-challenge'}
   */
  transition(input) {
    if (this.state == 'inactive') {
      if (input.action == 'auth') {
        this.state = 'pending';
        return 'send-registration-info';
      }
    } else if (this.state == 'pending') {
      if (input.action == 'register') {
        if (input.session_id == 'present' && input.device_bound_proof == 'valid') {
          this.state = 'bound';
          return 'send-config';
        }
      } else if (input.action == 'refresh') {
        if (input.device_bound_session_id == 'present' && input.device_bound_proof == 'valid') {
          this.state = 'bound';
          return 'send-config';
        }
      }
    } else if (this.state == 'bound') {
      if (input.action == 'refresh') {
        if (input.device_bound_session_id == 'present') {
          this.state = 'pending';
          return 'send-challenge';
        }
      }
    }

    this.state = 'inactive;'
    return 'error';
  }
}

export { DbscStateMachine };
