import { AuthService } from '../services/auth.service';
import { firstValueFrom, of, timeout, catchError } from 'rxjs';

export function appInitializer(authService: AuthService) {
    return () => firstValueFrom(
        authService.checkDetails().pipe(
            timeout(3000), // Don't block startup for more than 3 seconds
            catchError(err => {
                console.warn('AppInitializer: Auth check failed or timed out', err);
                return of(false); // Allow app to start even if auth check fails
            })
        )
    );
}
