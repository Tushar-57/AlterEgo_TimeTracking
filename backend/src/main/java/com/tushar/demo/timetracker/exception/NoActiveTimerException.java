// NoActiveTimerException.java
package com.tushar.demo.timetracker.exception;

public class NoActiveTimerException extends RuntimeException {
    public NoActiveTimerException() {
        super("From BE -> No Active Timer Currently.");
    }
}