import {Injectable, OnDestroy, OnInit} from '@angular/core';
import firebase from 'firebase';
import { User} from '../../shared/GoogleUser';
import {AngularFireAuth, AngularFireAuthModule} from '@angular/fire/auth';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Router} from '@angular/router';

declare var $: any;

@Injectable({
  providedIn: 'root'
})

export class LoginService implements  OnDestroy{

  user$?: BehaviorSubject<any>;
  public updatedFirebaseUser?: BehaviorSubject<User>;
  /** User object snapshot */
  private sub?: Subscription;
  public googleUser?: BehaviorSubject<firebase.User>;

  public subscribeObservable(user: firebase.User): Promise<firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>>{
    return this.afs.firestore.doc(`users/${user.uid}`).get();


  }

  constructor(readonly fire: AngularFireAuth,
              private afs: AngularFirestore,
              private router: Router) {
    const userStr = localStorage.getItem('user');
    const fireStoreUserStr = localStorage.getItem('firestoreUser');

    if (userStr !== null && userStr !== undefined)
    {

      if (this.googleUser === null || this.googleUser === undefined) {
        this.googleUser = new BehaviorSubject<firebase.User>(JSON.parse(userStr));

      }

      else{
        this.googleUser.next(JSON.parse(userStr));
      }

      if (fireStoreUserStr !== null && fireStoreUserStr !== undefined) {

        if (this.user$ === null || this.user$ === undefined) {
          this.user$ = new BehaviorSubject<firebase.User>(JSON.parse(fireStoreUserStr));

        } else {
          this.user$.next(JSON.parse(fireStoreUserStr));
        }

      }


      if ((userStr === null || userStr === undefined) && (fireStoreUserStr === null || fireStoreUserStr === undefined)) {
      //// Get auth data, then get firestore user document || null
      // Keeps a snapshot of the current user object
      this.sub = this.fire.authState.subscribe( (user) => {
        if (user != null)
        {
          this.subscribeObservable(user).then(userCredentials  => {

            const firestoreUser = userCredentials.data();

            if (user != null)
            {
              this.user$ = new BehaviorSubject<any>(firestoreUser);
            }

            else {
              this.user$?.next(firestoreUser);
            }
          });
        }
      });
      }
      }

    else {
      // Keeps a snapshot of the current user object
      this.sub = this.fire.authState.subscribe( (user) => {
        if (user != null)
        {
          if (this.googleUser == null && user !== null)
          {
            this.googleUser = new BehaviorSubject<firebase.User>(user);
          }
          else if (this.googleUser !== null && user !== null) {
            this.googleUser?.next(user) ;
          }

          localStorage.setItem('user', JSON.stringify(this.googleUser));

          this.subscribeObservable(user).then(userCredentials => {
            const updatedUser = userCredentials?.data();

            if (this.user$ == null && updatedUser !== null)
            {
              this.user$ = new BehaviorSubject<any>(updatedUser);
            }
            else if (this.user$ !== null && updatedUser !== null) {
              this.user$?.next(updatedUser) ;
            }

            localStorage.setItem('firestoreUser', JSON.stringify(this.user$));

          });
        }


      });
      }

    }

  ///// Role-based Authorization //////

  public canRead(user: User): boolean {
    const allowed = ['admin', 'subscriber'];
    return this.checkAuthorization(user, allowed);
  }

  public canEdit(user: User): boolean {
    const allowed = ['admin'];
    return this.checkAuthorization(user, allowed);
  }

  // determines if user has matching role
  private checkAuthorization(user: User, allowedRoles: string[]): boolean {
    if (!user) { return false; }
    for (const role of allowedRoles) {
      // @ts-ignore
      if ( user.roles[role] ) {
        return true;
      }
    }
    return false;
  }

  public async updateUserData(user: firebase.User | null): Promise<void> {
    // Sets user data to firestore on login
    const userRef: AngularFirestoreDocument<any> = this.afs.collection('users').doc(`${user?.uid}`);
    const data: User = {
      uid: user?.uid,
      email: user?.email,
      roles: {
        subscriber: true
      }
    };
    return await userRef.set(data, {merge: true});
  }


  public googleSignIn(): Promise<firebase.auth.UserCredential>
  {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    return this.fire.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  facebookSignIn(): void{
    /*TODO */
  }

  twitterSignIn(): void{
    /*TODO */
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getUser(): Observable<any> {
    return this.fire.user;
  }
}

