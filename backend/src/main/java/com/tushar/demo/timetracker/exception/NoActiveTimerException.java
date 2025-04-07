// NoActiveTimerException.java
package com.tushar.demo.timetracker.exception;

public class NoActiveTimerException extends RuntimeException {
    public NoActiveTimerException() {
        super("No active timer found");
    }
}